import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileItem } from "./FileItem";
import type { Item } from "../types/schema";
import { useState, memo } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface FolderListProps {
  items: Item[];
  level: number;
  allItems: Item[];
}

interface SortableItemProps {
  item: Item;
  level: number;
  allItems: Item[];
}

const SortableItem = memo(({ item, level, allItems }: SortableItemProps) => {
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({});
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ 
    id: item.id,
    data: {
      type: item.type,
      parentId: item.parentId,
      position: item.position
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'transform 100ms ease',
    zIndex: isDragging ? 999 : 'auto',
  };

  // Enhanced drop indicator
  const isOverFolder = isOver && item.type === 'folder';
  const dropIndicatorClass = isOverFolder ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${dropIndicatorClass}`}
      {...attributes}
      {...listeners}
    >
      <FileItem
        item={item}
        level={level}
        isOpen={openFolders[item.id] ?? false}
        onToggle={() => {
          if (item.type === 'folder') {
            setOpenFolders(prev => ({
              ...prev,
              [item.id]: !prev[item.id]
            }));
          }
        }}
        isDragging={isDragging}
      >
        {item.type === "folder" && (openFolders[item.id] ?? false) && (
          <div className="ml-6 mt-2 transition-all duration-150">
            <SortableContext 
              items={allItems.filter(i => i.parentId === item.id).map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {allItems
                .filter(i => i.parentId === item.id)
                .map((childItem) => (
                  <SortableItem 
                    key={childItem.id}
                    item={childItem}
                    level={level + 1}
                    allItems={allItems}
                  />
                ))}
            </SortableContext>
          </div>
        )}
      </FileItem>
    </div>
  );
});

SortableItem.displayName = 'SortableItem';

export function FolderList({ items, level, allItems }: FolderListProps) {
  return (
    <ErrorBoundary>
      <SortableContext 
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItem 
            key={item.id}
            item={item}
            level={level}
            allItems={allItems}
          />
        ))}
      </SortableContext>
    </ErrorBoundary>
  );
}
