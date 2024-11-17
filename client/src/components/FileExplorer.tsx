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

    // Handle dropping between folders
    const isBetweenFolders = targetItem.type === 'folder' && Math.abs(event.delta.y) >= 10;
    if (isBetweenFolders) {
      // Place at the target's position
      targetParentId = targetItem.parentId;
      position = targetItem.position;
    } else if (targetItem.type === 'folder' && Math.abs(event.delta.y) < 10) {
      // Place inside folder
      targetParentId = targetItem.id;
      const folderChildren = items.filter(item => item.parentId === targetItem.id);
      position = folderChildren.length;
    }

    socketEvents.moveItem({
      itemId: draggedItem.id,
      targetParentId,
      position
    }).catch(error => {
      console.error('Failed to move item:', error);
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