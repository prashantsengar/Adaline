import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'file' or 'folder'
  icon: text("icon").notNull(),
  parentId: integer("parent_id").references(() => items.id),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertItemSchema = createInsertSchema(items);
export const selectItemSchema = createSelectSchema(items);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = z.infer<typeof selectItemSchema>;

export const itemIconSchema = z.enum([
  "file-text",
  "folder",
  "image",
  "video",
  "music",
  "code",
  "archive"
]);
