import { pgTable, serial, integer, varchar, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  department_id: integer("department_id").notNull(),
  submitted_by: integer("submitted_by").notNull(),
  content_type: varchar("content_type", { length: 50 }).notNull(),
  headline: varchar("headline", { length: 255 }).notNull(),
  body: text("body").notNull(),
  link: varchar("link", { length: 500 }),
  attachment_url: varchar("attachment_url", { length: 500 }),
  requested_publish_date: date("requested_publish_date"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  admin_notes: text("admin_notes"),
  submitted_at: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  published_at: timestamp("published_at", { withTimezone: true }),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, submitted_at: true, published_at: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
