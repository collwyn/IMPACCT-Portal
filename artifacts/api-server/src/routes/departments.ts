import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, departmentsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/departments", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const depts = await db
    .select()
    .from(departmentsTable)
    .orderBy(departmentsTable.name);
  res.json(depts);
});

router.post("/departments", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, contact_email, active } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [dept] = await db
    .insert(departmentsTable)
    .values({ name, contact_email: contact_email ?? null, active: active ?? true })
    .returning();

  res.status(201).json(dept);
});

router.patch("/departments/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, contact_email, active } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates["name"] = name;
  if (contact_email !== undefined) updates["contact_email"] = contact_email;
  if (active !== undefined) updates["active"] = active;

  const [dept] = await db
    .update(departmentsTable)
    .set(updates)
    .where(eq(departmentsTable.id, id))
    .returning();

  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.json(dept);
});

export default router;
