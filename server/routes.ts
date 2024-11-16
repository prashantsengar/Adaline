import type { Express } from "express";
import { db } from "../db";
import { items } from "../db/schema";
import { asc } from "drizzle-orm";

export function registerRoutes(app: Express) {
  app.get("/api/items", async (req, res) => {
    const allItems = await db.select().from(items).orderBy(asc(items.position));
    res.json(allItems);
  });

  app.get("/api/items/:parentId", async (req, res) => {
    const parentId = parseInt(req.params.parentId);
    const folderItems = await db.select()
      .from(items)
      .where(eq(items.parentId, parentId))
      .orderBy(asc(items.position));
    res.json(folderItems);
  });
}
