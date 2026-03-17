import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/users", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      department_id: usersTable.department_id,
      created_at: usersTable.created_at,
    })
    .from(usersTable)
    .orderBy(usersTable.name);
  res.json(users);
});

router.post("/users", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, department_id } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }

  const validRoles = ["admin", "department_head", "staff"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, password_hash, role, department_id: department_id ?? null })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      department_id: usersTable.department_id,
      created_at: usersTable.created_at,
    });

  res.status(201).json(user);
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, email, password, role, department_id } = req.body;
  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates["name"] = name;
  if (email !== undefined) updates["email"] = email;
  if (role !== undefined) updates["role"] = role;
  if (department_id !== undefined) updates["department_id"] = department_id;
  if (password) updates["password_hash"] = await bcrypt.hash(password, 12);

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      department_id: usersTable.department_id,
      created_at: usersTable.created_at,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
