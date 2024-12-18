import { io } from "socket.io-client";
import type { Item } from "../types/schema";

const socket = io({
  // Ensure we're connecting to the same origin
  path: "/socket.io",
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

// Connection status monitoring with detailed logging
socket.on("connect", () => {
  console.log("Socket connected successfully", {
    id: socket.id,
    connected: socket.connected,
    transport: socket.io.engine.transport.name
  });
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", {
    error,
    message: error.message,
    type: error.type,
    description: error.description
  });
  // Attempt to reconnect with a different transport
  if (socket.io.engine.transport.name === 'websocket') {
    socket.io.engine.transport.name = 'polling';
  }
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", {
    reason,
    wasConnected: socket.connected,
    attempts: socket.io.engine.reconnectionAttempts
  });
});

socket.io.on("error", (error) => {
  console.error("Transport error:", error);
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("Reconnection attempt:", attempt);
});

// Helper function to handle socket emissions with error handling and timeouts
const emitWithError = async <T>(event: string, data: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Socket ${event} timeout after 5000ms`));
    }, 5000);

    socket.emit(event, data, (response: { error?: string; data?: T }) => {
      clearTimeout(timeout);
      if (response?.error) {
        console.error(`Socket ${event} error:`, response.error);
        reject(new Error(response.error));
      } else {
        console.log(`Socket ${event} successful:`, {
          event,
          data: response?.data
        });
        resolve(response?.data as T);
      }
    });
  });
};

export const socketEvents = {
  moveItem: async (data: { itemId: number; targetParentId: number | null; position: number }) => {
    console.log('Sending moveItem event:', data);
    try {
      const result = await emitWithError("moveItem", data);
      console.log('Move successful:', result);
      return result;
    } catch (error) {
      console.error('Move failed:', error);
      throw error;
    }
  },
  
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
