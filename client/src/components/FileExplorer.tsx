import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FolderList } from "./FolderList";
import { socketEvents } from "../lib/socket";
import type { Item } from "../types/schema";
import { ErrorBoundary } from "./ErrorBoundary";

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
    
    if (!over || active.id === over.id) {
      console.log('No valid destination, skipping update');
      return;
    }

    const draggedItem = items.find(item => item.id === active.id);
    const targetItem = items.find(item => item.id === over.id);
    
    if (!draggedItem || !targetItem) return;

    let targetParentId = targetItem.parentId;
    let position = targetItem.position;

    // If dropping directly between items (not on a folder), use the target's parent
    if (targetItem.type !== 'folder' || event.modifiers?.shiftKey) {
      targetParentId = targetItem.parentId;
      position = targetItem.position;
    } else {
      // Only make it a child of folder if dropping directly on folder
      const isDirectlyOnFolder = Math.abs(event.delta.y) < 10;
      if (isDirectlyOnFolder) {
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetParentId);
        position = folderChildren.length;
      }
    }

    // Special case: dropping at root level
    if (event.over.data?.current?.isRoot) {
      targetParentId = null;
      const rootItems = items.filter(item => !item.parentId);
      position = rootItems.length;
    }

    console.log('Moving item:', {
      itemId: draggedItem.id,
      targetParentId,
      position
    });

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
