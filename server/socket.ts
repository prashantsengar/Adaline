import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "../db";
import { items, type Item } from "../db/schema";
import { eq, and, gte, lte, asc, desc } from "drizzle-orm";

export function setupSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Add error middleware
  io.use((socket, next) => {
    try {
      console.log("Socket middleware - new connection attempt:", socket.id);
      next();
    } catch (err) {
      console.error('Socket middleware error:', err);
      next(new Error('Internal server error'));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("moveItem", async (data: { itemId: number, targetParentId: number | null, position: number }, callback) => {
      try {
        const { itemId, targetParentId, position } = data;
        console.log("Moving item:", { itemId, targetParentId, position });
        
        // Get the source item and its current parent
        const [sourceItem] = await db.select()
          .from(items)
          .where(eq(items.id, itemId));

        if (!sourceItem) {
          throw new Error("Item not found");
        }

        const sourceParentId = sourceItem.parentId;
        const oldPosition = sourceItem.position;

        // Update positions in the source parent
        if (sourceParentId !== targetParentId) {
          // Moving between different parents
          // 1. Update positions in the source parent
          await db.update(items)
            .set({ 
              position: db.sql`${items.position} - 1`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(items.parentId, sourceParentId),
                gte(items.position, oldPosition)
              )
            );

          // 2. Update positions in the target parent
          await db.update(items)
            .set({ 
              position: db.sql`${items.position} + 1`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(items.parentId, targetParentId),
                gte(items.position, position)
              )
            );
        } else {
          // Moving within the same parent
          if (oldPosition < position) {
            // Moving down
            await db.update(items)
              .set({ 
                position: db.sql`${items.position} - 1`,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(items.parentId, sourceParentId),
                  gte(items.position, oldPosition),
                  lte(items.position, position)
                )
              );
          } else if (oldPosition > position) {
            // Moving up
            await db.update(items)
              .set({ 
                position: db.sql`${items.position} + 1`,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(items.parentId, sourceParentId),
                  gte(items.position, position),
                  lte(items.position, oldPosition)
                )
              );
          }
        }

        // Finally, update the source item
        const [updatedItem] = await db.update(items)
          .set({ 
            parentId: targetParentId,
            position,
            updatedAt: new Date()
          })
          .where(eq(items.id, itemId))
          .returning();

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

        // Update positions of existing items in the same parent
        await db.update(items)
          .set({ 
            position: db.sql`${items.position} + 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(items.parentId, item.parentId),
              gte(items.position, item.position)
            )
          );

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

        // Update positions of remaining items
        await db.update(items)
          .set({ 
            position: db.sql`${items.position} - 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(items.parentId, deletedItem.parentId),
              gte(items.position, deletedItem.position)
            )
          );

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
