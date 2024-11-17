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

    let targetParentId = targetItem.parentId;
    let position = targetItem.position;

    // More precise folder drop detection
    if (targetItem.type === 'folder') {
      const dropPoint = {
        x: event.delta.x,
        y: event.delta.y
      };
      const isDirectFolderDrop = Math.abs(dropPoint.y) < 5 && Math.abs(dropPoint.x) < 20;
      
      if (isDirectFolderDrop) {
        // Drop inside folder
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetItem.id);
        position = folderChildren.length;
      } else {
        // Drop between items
        targetParentId = targetItem.parentId;
        position = targetItem.position + (dropPoint.y > 0 ? 1 : 0);
      }
    } else {
      // Regular reordering
      targetParentId = targetItem.parentId;
      position = targetItem.position;
    }

    // Optimistic updates
    const updatedItems = [...items];
    const oldIndex = updatedItems.findIndex(item => item.id === draggedItem.id);
    const newIndex = updatedItems.findIndex(item => item.id === targetItem.id);
    
    // Update positions for all affected items
    const affectedItems = updatedItems.filter(item => 
      item.parentId === targetParentId && 
      ((item.position >= position && item.id !== draggedItem.id) || 
       (draggedItem.parentId === targetParentId && item.position > draggedItem.position))
    );

    // Immediately update UI
    const movedItem = {...draggedItem, parentId: targetParentId, position};
    const reorderedItems = [
      ...items.filter(item => item.id !== draggedItem.id && !affectedItems.find(a => a.id === item.id)),
      ...affectedItems.map(item => ({
        ...item,
        position: item.position + (item.position >= position ? 1 : -1)
      })),
      movedItem
    ].sort((a, b) => {
      if (a.parentId === b.parentId) return a.position - b.position;
      return 0;
    });

    // Send update to server
    socketEvents.moveItem({
      itemId: draggedItem.id,
      targetParentId,
      position
    }).catch((error) => {
      console.error('Move failed:', error);
      // Revert optimistic update here if needed
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
