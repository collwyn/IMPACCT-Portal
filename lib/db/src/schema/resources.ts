import { pgTable, serial, integer, varchar, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  category_id: integer("category_id").notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }),
  login_info_location: varchar("login_info_location", { length: 255 }),
  access_level: varchar("access_level", { length: 30 }).notNull().default("everyone"),
  cost: varchar("cost", { length: 100 }),
  renewal_date: date("renewal_date"),
  added_by: integer("added_by").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, created_at: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
