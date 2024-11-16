import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "../db";
import { items, type Item } from "../db/schema";
import { eq } from "drizzle-orm";

export function setupSocket(server: HTTPServer) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("moveItem", async (data: { itemId: number, targetParentId: number | null, position: number }) => {
      const { itemId, targetParentId, position } = data;
      
      await db.update(items)
        .set({ 
          parentId: targetParentId,
          position,
          updatedAt: new Date()
        })
        .where(eq(items.id, itemId));

      io.emit("itemMoved", data);
    });

    socket.on("createItem", async (item: Omit<Item, "id" | "createdAt" | "updatedAt">) => {
      const [newItem] = await db.insert(items)
        .values({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      io.emit("itemCreated", newItem);
    });

    socket.on("deleteItem", async (itemId: number) => {
      await db.delete(items).where(eq(items.id, itemId));
      io.emit("itemDeleted", itemId);
    });
  });

  return io;
}
