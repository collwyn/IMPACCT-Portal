import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, submissionsTable, statusHistoryTable, usersTable, departmentsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { notifySubmissionStatus, notifyNewSubmission } from "../mailer.js";

const router: IRouter = Router();

router.get("/submissions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const query = db
    .select({
      id: submissionsTable.id,
      department_id: submissionsTable.department_id,
      submitted_by: submissionsTable.submitted_by,
      content_type: submissionsTable.content_type,
      headline: submissionsTable.headline,
      body: submissionsTable.body,
      link: submissionsTable.link,
      attachment_url: submissionsTable.attachment_url,
      requested_publish_date: submissionsTable.requested_publish_date,
      status: submissionsTable.status,
      admin_notes: submissionsTable.admin_notes,
      submitted_at: submissionsTable.submitted_at,
      published_at: submissionsTable.published_at,
      submitter_name: usersTable.name,
      department_name: departmentsTable.name,
    })
    .from(submissionsTable)
    .leftJoin(usersTable, eq(submissionsTable.submitted_by, usersTable.id))
    .leftJoin(departmentsTable, eq(submissionsTable.department_id, departmentsTable.id))
    .orderBy(desc(submissionsTable.submitted_at));

  let rows;
  if (user.role === "department_head" && user.department_id) {
    rows = await query.where(eq(submissionsTable.department_id, user.department_id));
  } else if (user.role === "admin") {
    rows = await query;
  } else {
    rows = [];
  }

  res.json(rows);
});

router.post("/submissions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { department_id, content_type, headline, body, link, attachment_url, requested_publish_date } = req.body;

  if (!department_id || !content_type || !headline || !body) {
    res.status(400).json({ error: "department_id, content_type, headline, and body are required" });
    return;
  }

  const validTypes = ["event", "program_update", "staff_change", "resource", "news"];
  if (!validTypes.includes(content_type)) {
    res.status(400).json({ error: "Invalid content_type" });
    return;
  }

  const [submission] = await db
    .insert(submissionsTable)
    .values({
      department_id,
      submitted_by: user.id,
      content_type,
      headline,
      body,
      link: link ?? null,
      attachment_url: attachment_url ?? null,
      requested_publish_date: requested_publish_date ?? null,
      status: "pending",
    })
    .returning();

  if (!submission) {
    res.status(500).json({ error: "Failed to create submission" });
    return;
  }

  const [dept] = await db
    .select({ name: departmentsTable.name })
    .from(departmentsTable)
    .where(eq(departmentsTable.id, department_id));

  const admins = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  for (const admin of admins) {
    await notifyNewSubmission(admin.email, headline, dept?.name ?? "Unknown");
  }

  res.status(201).json({ ...submission, submitter_name: user.name, department_name: dept?.name ?? null });
});

router.get("/submissions/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [submission] = await db
    .select({
      id: submissionsTable.id,
      department_id: submissionsTable.department_id,
      submitted_by: submissionsTable.submitted_by,
      content_type: submissionsTable.content_type,
      headline: submissionsTable.headline,
      body: submissionsTable.body,
      link: submissionsTable.link,
      attachment_url: submissionsTable.attachment_url,
      requested_publish_date: submissionsTable.requested_publish_date,
      status: submissionsTable.status,
      admin_notes: submissionsTable.admin_notes,
      submitted_at: submissionsTable.submitted_at,
      published_at: submissionsTable.published_at,
      submitter_name: usersTable.name,
      department_name: departmentsTable.name,
    })
    .from(submissionsTable)
    .leftJoin(usersTable, eq(submissionsTable.submitted_by, usersTable.id))
    .leftJoin(departmentsTable, eq(submissionsTable.department_id, departmentsTable.id))
    .where(eq(submissionsTable.id, id));

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const history = await db
    .select({
      id: statusHistoryTable.id,
      submission_id: statusHistoryTable.submission_id,
      changed_by: statusHistoryTable.changed_by,
      old_status: statusHistoryTable.old_status,
      new_status: statusHistoryTable.new_status,
      note: statusHistoryTable.note,
      changed_at: statusHistoryTable.changed_at,
      changed_by_name: usersTable.name,
    })
    .from(statusHistoryTable)
    .leftJoin(usersTable, eq(statusHistoryTable.changed_by, usersTable.id))
    .where(eq(statusHistoryTable.submission_id, id))
    .orderBy(statusHistoryTable.changed_at);

  res.json({ ...submission, history });
});

router.patch("/submissions/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { status, admin_notes, note } = req.body;

  const validStatuses = ["pending", "published", "needs_revision"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [existing] = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const updates: Record<string, unknown> = { status, admin_notes: admin_notes ?? existing.admin_notes };
  if (status === "published") {
    updates["published_at"] = new Date();
  }

  await db.transaction(async (tx) => {
    await tx
      .update(submissionsTable)
      .set(updates)
      .where(eq(submissionsTable.id, id));

    await tx
      .insert(statusHistoryTable)
      .values({
        submission_id: id,
        changed_by: user.id,
        old_status: existing.status,
        new_status: status,
        note: note ?? null,
      });
  });

  const [updated] = await db
    .select({
      id: submissionsTable.id,
      department_id: submissionsTable.department_id,
      submitted_by: submissionsTable.submitted_by,
      content_type: submissionsTable.content_type,
      headline: submissionsTable.headline,
      body: submissionsTable.body,
      link: submissionsTable.link,
      attachment_url: submissionsTable.attachment_url,
      requested_publish_date: submissionsTable.requested_publish_date,
      status: submissionsTable.status,
      admin_notes: submissionsTable.admin_notes,
      submitted_at: submissionsTable.submitted_at,
      published_at: submissionsTable.published_at,
      submitter_name: usersTable.name,
      department_name: departmentsTable.name,
    })
    .from(submissionsTable)
    .leftJoin(usersTable, eq(submissionsTable.submitted_by, usersTable.id))
    .leftJoin(departmentsTable, eq(submissionsTable.department_id, departmentsTable.id))
    .where(eq(submissionsTable.id, id));

  const [submitter] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, existing.submitted_by));

  if (submitter) {
    await notifySubmissionStatus(submitter.email, status, existing.headline, admin_notes);
  }

  res.json(updated);
});

export default router;
