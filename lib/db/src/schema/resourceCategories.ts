import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourceCategoriesTable = pgTable("resource_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  suggested_by: integer("suggested_by"),
  approved_by: integer("approved_by"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertResourceCategorySchema = createInsertSchema(resourceCategoriesTable).omit({ id: true, created_at: true });
export type InsertResourceCategory = z.infer<typeof insertResourceCategorySchema>;
export type ResourceCategory = typeof resourceCategoriesTable.$inferSelect;
