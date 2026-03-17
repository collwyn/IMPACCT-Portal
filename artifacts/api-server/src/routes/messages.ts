import { Router, type IRouter, type Request, type Response } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

const messageSelect = {
  id: messagesTable.id,
  sender_id: messagesTable.sender_id,
  recipient_id: messagesTable.recipient_id,
  body: messagesTable.body,
  is_read: messagesTable.is_read,
  created_at: messagesTable.created_at,
};

router.get("/messages", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const rows = await db
    .select({
      ...messageSelect,
      sender_name: usersTable.name,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(usersTable.id, messagesTable.sender_id))
    .where(or(eq(messagesTable.sender_id, userId), eq(messagesTable.recipient_id, userId)))
    .orderBy(messagesTable.created_at);

  const recipientIds = [...new Set(rows.map(r => r.recipient_id))];
  const recipients = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, recipientIds[0] ?? 0));

  const recipientMap = new Map(recipients.map(r => [r.id, r.name]));

  const allRecipientIds = [...new Set(rows.map(r => r.recipient_id))];
  const allRecipients = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);
  const allRecipientsMap = new Map(allRecipients.map(r => [r.id, r.name]));

  const result = rows.map(r => ({
    ...r,
    recipient_name: allRecipientsMap.get(r.recipient_id) ?? "Unknown",
  }));

  res.json(result);
});

router.get("/messages/thread/:userId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user!.id;
  const raw = Array.isArray(req.params["userId"]) ? req.params["userId"][0] : req.params["userId"];
  const otherUserId = parseInt(raw ?? "", 10);

  if (isNaN(otherUserId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  const rows = await db
    .select({
      ...messageSelect,
      sender_name: usersTable.name,
    })
    .from(messagesTable)
    .innerJoin(usersTable, eq(usersTable.id, messagesTable.sender_id))
    .where(
      or(
        and(eq(messagesTable.sender_id, currentUserId), eq(messagesTable.recipient_id, otherUserId)),
        and(eq(messagesTable.sender_id, otherUserId), eq(messagesTable.recipient_id, currentUserId))
      )
    )
    .orderBy(messagesTable.created_at);

  const allUsers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u.name]));

  const result = rows.map(r => ({
    ...r,
    recipient_name: userMap.get(r.recipient_id) ?? "Unknown",
  }));

  res.json(result);
});

router.post("/messages", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const senderId = req.user!.id;
  const { recipient_id, body } = req.body;

  if (!recipient_id || !body?.trim()) {
    res.status(400).json({ error: "recipient_id and body are required" });
    return;
  }

  const [recipient] = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, recipient_id));

  if (!recipient) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({ sender_id: senderId, recipient_id, body: body.trim() })
    .returning(messageSelect);

  const [sender] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, senderId));

  res.status(201).json({
    ...message,
    sender_name: sender?.name ?? "Unknown",
    recipient_name: recipient.name,
  });
});

router.patch("/messages/:id/read", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [message] = await db
    .update(messagesTable)
    .set({ is_read: true })
    .where(and(eq(messagesTable.id, id), eq(messagesTable.recipient_id, userId)))
    .returning(messageSelect);

  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const allUsers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u.name]));

  res.json({
    ...message,
    sender_name: userMap.get(message.sender_id) ?? "Unknown",
    recipient_name: userMap.get(message.recipient_id) ?? "Unknown",
  });
});

export default router;
