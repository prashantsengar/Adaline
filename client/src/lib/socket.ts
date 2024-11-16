import { io } from "socket.io-client";

const socket = io();

export const socketEvents = {
  moveItem: (data: { itemId: number, targetParentId: number | null, position: number }) => 
    socket.emit("moveItem", data),
  createItem: (item: any) => socket.emit("createItem", item),
  deleteItem: (itemId: number) => socket.emit("deleteItem", itemId),
  onItemMoved: (callback: (data: any) => void) => socket.on("itemMoved", callback),
  onItemCreated: (callback: (item: any) => void) => socket.on("itemCreated", callback),
  onItemDeleted: (callback: (itemId: number) => void) => socket.on("itemDeleted", callback)
};

export default socket;
