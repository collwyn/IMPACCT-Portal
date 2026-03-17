import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statusHistoryTable = pgTable("status_history", {
  id: serial("id").primaryKey(),
  submission_id: integer("submission_id").notNull(),
  changed_by: integer("changed_by").notNull(),
  old_status: varchar("old_status", { length: 30 }),
  new_status: varchar("new_status", { length: 30 }).notNull(),
  note: text("note"),
  changed_at: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertStatusHistorySchema = createInsertSchema(statusHistoryTable).omit({ id: true, changed_at: true });
export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
export type StatusHistory = typeof statusHistoryTable.$inferSelect;
