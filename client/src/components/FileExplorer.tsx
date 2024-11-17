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

    // If dropping on a folder, make it a child
    if (targetItem.type === 'folder') {
      const dropOffset = event.delta.y;
      const dropThreshold = 10; // pixels
      
      if (Math.abs(dropOffset) < dropThreshold) {
        // Dropping directly on folder - make it a child
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetItem.id);
        position = folderChildren.length;
      } else {
        // Dropping between items - maintain same parent
        targetParentId = targetItem.parentId;
        position = targetItem.position;
        if (dropOffset > 0) position += 1;
      }
    }

    console.log('Moving item:', {
      itemId: draggedItem.id,
      targetParentId,
      position,
      dropDetails: {
        type: targetItem.type,
        offset: event.delta.y
      }
    });

    socketEvents.moveItem({
      itemId: draggedItem.id,
      targetParentId,
      position
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
