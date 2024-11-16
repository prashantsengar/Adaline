import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { FileExplorer } from "../components/FileExplorer";
import { CreateItemDialog } from "../components/CreateItemDialog";
import { socketEvents } from "../lib/socket";
import type { Item } from "../types/schema";

export default function FileSystem() {
  const { data: items, error } = useSWR<Item[]>("/api/items");

  useEffect(() => {
    socketEvents.onItemMoved(() => mutate("/api/items"));
    socketEvents.onItemCreated(() => mutate("/api/items"));
    socketEvents.onItemDeleted(() => mutate("/api/items"));
  }, []);

  if (error) return <div>Failed to load</div>;
  if (!items) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">File System</h1>
        <CreateItemDialog />
      </div>
      <FileExplorer items={items} />
    </div>
  );
}
