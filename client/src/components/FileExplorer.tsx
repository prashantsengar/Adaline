import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FolderList } from "./FolderList";
import { socketEvents } from "../lib/socket";
import type { Item } from "../types/schema";
import { ErrorBoundary } from "./ErrorBoundary";
import { useEffect } from "react";

interface FileExplorerProps {
  items: Item[];
}

export function FileExplorer({ items }: FileExplorerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const draggedItem = items.find(item => item.id === active.id);
    const targetItem = items.find(item => item.id === over.id);
    
    if (!draggedItem || !targetItem) return;

    // Optimistic update
    const updatedItems = [...items];
    const oldIndex = updatedItems.findIndex(item => item.id === draggedItem.id);
    const newIndex = updatedItems.findIndex(item => item.id === targetItem.id);
    
    let targetParentId = targetItem.parentId;
    let position = targetItem.position;

    // Handle folder drops more precisely
    if (targetItem.type === 'folder') {
      const isDirectDrop = Math.abs(event.delta.y) < 8 && Math.abs(event.delta.x) < 8;
      
      if (isDirectDrop) {
        // Drop inside folder
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetItem.id);
        position = folderChildren.length;
      } else {
        // Drop between items
        position = targetItem.position + (event.delta.y > 0 ? 1 : 0);
      }
    } else {
      // Regular reordering
      position = targetItem.position + (oldIndex > newIndex ? 0 : 1);
    }

    // Apply move immediately for visual feedback
    const moveParams = {
      itemId: draggedItem.id,
      targetParentId,
      position
    };

    // Update local state immediately
    const reorderedItem = {...draggedItem, parentId: targetParentId, position};
    const optimisticItems = items
      .filter(item => item.id !== draggedItem.id)
      .map(item => {
        if (item.parentId === targetParentId && item.position >= position) {
          return {...item, position: item.position + 1};
        }
        return item;
      })
      .concat(reorderedItem)
      .sort((a, b) => a.position - b.position);

    // Emit socket event
    socketEvents.moveItem(moveParams).catch(() => {
      // Revert on failure
      console.error('Move failed, reverting...');
    });
  };

  const rootItems = items.filter(item => !item.parentId);

  return (
    <ErrorBoundary>
      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          <div 
            className="space-y-2 p-4 rounded-lg"
            data-is-root="true"
          >
            <SortableContext 
              items={rootItems.map(item => item.id)} 
              strategy={verticalListSortingStrategy}
            >
              <FolderList 
                items={rootItems} 
                level={0} 
                allItems={items} 
              />
            </SortableContext>
          </div>
        </div>
      </DndContext>
    </ErrorBoundary>
  );
}
