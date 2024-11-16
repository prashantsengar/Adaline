import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileItem } from "./FileItem";
import type { Item } from "../types/schema";
import { useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface FolderListProps {
  items: Item[];
  level: number;
  allItems: Item[];
}

function SortableItem({ item, level, allItems }: { item: Item; level: number; allItems: Item[] }) {
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({});

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    data: {
      type: item.type,
      parentId: item.parentId,
      name: item.name
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const toggleFolder = (folderId: number) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <FileItem
        item={item}
        level={level}
        isOpen={openFolders[item.id] ?? false}
        onToggle={() => toggleFolder(item.id)}
        isDragging={isDragging}
      >
        {item.type === "folder" && (openFolders[item.id] ?? false) && (
          <div className="ml-6 mt-2 transition-all duration-200">
            <SortableContext 
              items={allItems.filter(i => i.parentId === item.id).map(i => i.id)} 
              strategy={verticalListSortingStrategy}
            >
              <FolderList
                items={allItems.filter(i => i.parentId === item.id)}
                level={level + 1}
                allItems={allItems}
              />
            </SortableContext>
          </div>
        )}
      </FileItem>
    </div>
  );
}

export function FolderList({ items, level, allItems }: FolderListProps) {
  return (
    <ErrorBoundary>
      {items.map((item) => (
        <SortableItem 
          key={item.id}
          item={item}
          level={level}
          allItems={allItems}
        />
      ))}
    </ErrorBoundary>
  );
}
