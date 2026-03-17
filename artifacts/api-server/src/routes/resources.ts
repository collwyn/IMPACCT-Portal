import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, resourcesTable, resourceCategoriesTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/resources", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      id: resourcesTable.id,
      name: resourcesTable.name,
      category_id: resourcesTable.category_id,
      description: resourcesTable.description,
      url: resourcesTable.url,
      login_info_location: resourcesTable.login_info_location,
      access_level: resourcesTable.access_level,
      cost: resourcesTable.cost,
      renewal_date: resourcesTable.renewal_date,
      added_by: resourcesTable.added_by,
      notes: resourcesTable.notes,
      created_at: resourcesTable.created_at,
      category_name: resourceCategoriesTable.name,
      added_by_name: usersTable.name,
    })
    .from(resourcesTable)
    .leftJoin(resourceCategoriesTable, eq(resourcesTable.category_id, resourceCategoriesTable.id))
    .leftJoin(usersTable, eq(resourcesTable.added_by, usersTable.id))
    .orderBy(resourcesTable.name);

  res.json(rows);
});

router.post("/resources", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { name, category_id, description, url, login_info_location, access_level, cost, renewal_date, notes } = req.body;

  if (!name || !category_id) {
    res.status(400).json({ error: "name and category_id are required" });
    return;
  }

  const [resource] = await db
    .insert(resourcesTable)
    .values({
      name,
      category_id,
      description: description ?? null,
      url: url ?? null,
      login_info_location: login_info_location ?? null,
      access_level: access_level ?? "everyone",
      cost: cost ?? null,
      renewal_date: renewal_date ?? null,
      added_by: user.id,
      notes: notes ?? null,
    })
    .returning();

  const [category] = await db
    .select({ name: resourceCategoriesTable.name })
    .from(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.id, category_id));

  res.status(201).json({ ...resource, category_name: category?.name ?? null, added_by_name: user.name });
});

router.patch("/resources/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, category_id, description, url, login_info_location, access_level, cost, renewal_date, notes } = req.body;
  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates["name"] = name;
  if (category_id !== undefined) updates["category_id"] = category_id;
  if (description !== undefined) updates["description"] = description;
  if (url !== undefined) updates["url"] = url;
  if (login_info_location !== undefined) updates["login_info_location"] = login_info_location;
  if (access_level !== undefined) updates["access_level"] = access_level;
  if (cost !== undefined) updates["cost"] = cost;
  if (renewal_date !== undefined) updates["renewal_date"] = renewal_date;
  if (notes !== undefined) updates["notes"] = notes;

  const [resource] = await db
    .update(resourcesTable)
    .set(updates)
    .where(eq(resourcesTable.id, id))
    .returning();

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  const [category] = await db
    .select({ name: resourceCategoriesTable.name })
    .from(resourceCategoriesTable)
    .where(eq(resourceCategoriesTable.id, resource.category_id));

  const [addedByUser] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, resource.added_by));

  res.json({ ...resource, category_name: category?.name ?? null, added_by_name: addedByUser?.name ?? null });
});

router.delete("/resources/:id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [resource] = await db
    .delete(resourcesTable)
    .where(eq(resourcesTable.id, id))
    .returning({ id: resourcesTable.id });

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
