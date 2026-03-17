import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, resourceCategoriesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/resource-categories", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.status, "active"))
    .orderBy(resourceCategoriesTable.name);
  res.json(rows);
});

router.post("/resource-categories/suggest", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [category] = await db
    .insert(resourceCategoriesTable)
    .values({ name, status: "pending", suggested_by: user.id })
    .returning();

  res.status(201).json(category);
});

router.get("/resource-categories/pending", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select()
    .from(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.status, "pending"))
    .orderBy(resourceCategoriesTable.created_at);
  res.json(rows);
});

router.patch("/resource-categories/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [category] = await db
    .update(resourceCategoriesTable)
    .set({ status: "active", approved_by: user.id })
    .where(eq(resourceCategoriesTable.id, id))
    .returning();

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(category);
});

router.delete("/resource-categories/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [category] = await db
    .delete(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.id, id))
    .returning({ id: resourceCategoriesTable.id });

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
