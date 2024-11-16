import { io } from "socket.io-client";
import type { Item } from "../types/schema";

const socket = io();

// Connection status monitoring
socket.on("connect", () => {
  console.log("Socket connected successfully");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

// Helper function to handle socket emissions with error handling
const emitWithError = async <T>(event: string, data: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response: { error?: string; data?: T }) => {
      if (response?.error) {
        console.error(`Socket ${event} error:`, response.error);
        reject(new Error(response.error));
      } else {
        console.log(`Socket ${event} successful:`, data);
        resolve(response?.data as T);
      }
    });
  });
};

export const socketEvents = {
  moveItem: (data: { itemId: number; targetParentId: number | null; position: number }) =>
    emitWithError("moveItem", data),
  
  createItem: (item: Omit<Item, "id" | "createdAt" | "updatedAt">) =>
    emitWithError<Item>("createItem", item),
  
  deleteItem: (itemId: number) =>
    emitWithError("deleteItem", itemId),
  
  onItemMoved: (callback: (data: any) => void) => {
    socket.on("itemMoved", (data) => {
      console.log("Item moved:", data);
      callback(data);
    });
  },
  
  onItemCreated: (callback: (item: Item) => void) => {
    socket.on("itemCreated", (item) => {
      console.log("Item created:", item);
      callback(item);
    });
  },
  
  onItemDeleted: (callback: (itemId: number) => void) => {
    socket.on("itemDeleted", (itemId) => {
      console.log("Item deleted:", itemId);
      callback(itemId);
    });
  },
};

export default socket;
