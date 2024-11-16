import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "../db";
import { items, type Item } from "../db/schema";
import { eq } from "drizzle-orm";

export function setupSocket(server: HTTPServer) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    socket.on("moveItem", async (data: { itemId: number, targetParentId: number | null, position: number }, callback) => {
      try {
        const { itemId, targetParentId, position } = data;
        console.log("Moving item:", { itemId, targetParentId, position });
        
        const [updatedItem] = await db.update(items)
          .set({ 
            parentId: targetParentId,
            position,
            updatedAt: new Date()
          })
          .where(eq(items.id, itemId))
          .returning();

        if (!updatedItem) {
          throw new Error("Item not found");
        }

        io.emit("itemMoved", data);
        callback?.({ data: updatedItem });
      } catch (error) {
        console.error("Error moving item:", error);
        callback?.({ error: "Failed to move item" });
      }
    });

    socket.on("createItem", async (item: Omit<Item, "id" | "createdAt" | "updatedAt">, callback) => {
      try {
        console.log("Creating item:", item);
        
        // Validate required fields
        if (!item.name || !item.type || !item.icon) {
          throw new Error("Missing required fields");
        }

        const [newItem] = await db.insert(items)
          .values({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        console.log("Item created successfully:", newItem);
        io.emit("itemCreated", newItem);
        callback?.({ data: newItem });
      } catch (error) {
        console.error("Error creating item:", error);
        callback?.({ error: "Failed to create item" });
      }
    });

    socket.on("deleteItem", async (itemId: number, callback) => {
      try {
        console.log("Deleting item:", itemId);
        
        const [deletedItem] = await db.delete(items)
          .where(eq(items.id, itemId))
          .returning();

        if (!deletedItem) {
          throw new Error("Item not found");
        }

        io.emit("itemDeleted", itemId);
        callback?.({ data: itemId });
      } catch (error) {
        console.error("Error deleting item:", error);
        callback?.({ error: "Failed to delete item" });
      }
    });
  });

  return io;
}
