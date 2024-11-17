import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "../db";
import { items, type Item } from "../db/schema";
import { eq, and, gte, gt, lt, lte, sql } from "drizzle-orm";

export function setupSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/socket.io/",
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true
  });

  io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err);
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
        
        // Get the source item and validate
        const sourceItems = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
        if (!sourceItems.length) {
          throw new Error("Item not found");
        }

        const sourceItem = sourceItems[0];
        const sourceParentId = sourceItem.parentId;
        const oldPosition = sourceItem.position;

        // Begin transaction to ensure atomic updates
        await db.transaction(async (tx) => {
          if (sourceParentId !== targetParentId) {
            // Moving between different parents
            // First, decrease positions in source parent
            await tx.update(items)
              .set({ 
                position: sql`${items.position} - 1`,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(items.parentId, sourceParentId),
                  gt(items.position, oldPosition)
                )
              );

            // Then, increase positions in target parent
            await tx.update(items)
              .set({ 
                position: sql`${items.position} + 1`,
                updatedAt: new Date()
              })
              .where(
                and(
                  eq(items.parentId, targetParentId),
                  gte(items.position, position)
                )
              );
          } else {
            // Moving within same parent
            if (oldPosition < position) {
              // Moving down - decrease positions of items between old and new position
              await tx.update(items)
                .set({ 
                  position: sql`${items.position} - 1`,
                  updatedAt: new Date()
                })
                .where(
                  and(
                    eq(items.parentId, sourceParentId),
                    gt(items.position, oldPosition),
                    lte(items.position, position)
                  )
                );
            } else if (oldPosition > position) {
              // Moving up - increase positions of items between new and old position
              await tx.update(items)
                .set({ 
                  position: sql`${items.position} + 1`,
                  updatedAt: new Date()
                })
                .where(
                  and(
                    eq(items.parentId, sourceParentId),
                    gte(items.position, position),
                    lt(items.position, oldPosition)
                  )
                );
            }
          }

          // Finally update the moved item
          await tx.update(items)
            .set({ 
              parentId: targetParentId,
              position,
              updatedAt: new Date()
            })
            .where(eq(items.id, itemId));
        });

        // Get the updated item to return
        const updatedItems = await db.select()
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        const updatedItem = updatedItems[0];
        io.emit("itemMoved", updatedItem);
        callback?.({ data: updatedItem });
      } catch (error) {
        console.error("Error moving item:", error);
        callback?.({ error: "Failed to move item" });
      }
    });

    socket.on("createItem", async (item: Omit<Item, "id" | "createdAt" | "updatedAt">, callback) => {
      try {
        console.log("Creating item:", item);
        
        if (!item.name || !item.type || !item.icon) {
          throw new Error("Missing required fields");
        }

        await db.update(items)
          .set({ 
            position: sql`${items.position} + 1`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(items.parentId, item.parentId),
              gte(items.position, item.position)
            )
          );

        const newItems = await db.insert(items)
          .values({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        const newItem = newItems[0];
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
        
        const deletedItems = await db.delete(items)
          .where(eq(items.id, itemId))
          .returning();

        if (!deletedItems.length) {
          throw new Error("Item not found");
        }

        const deletedItem = deletedItems[0];

        await db.update(items)
          .set({ 
            position: sql`${items.position} - 1`,
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
