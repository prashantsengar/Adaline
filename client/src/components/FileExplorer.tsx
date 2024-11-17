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
    
    if (!over || active.id === over.id) return;

    const draggedItem = items.find(item => item.id === active.id);
    const targetItem = items.find(item => item.id === over.id);
    
    if (!draggedItem || !targetItem) return;

    // Calculate drop position
    const dropPoint = {
      x: event.delta.x,
      y: event.delta.y
    };

    let targetParentId = targetItem.parentId;
    let position;

    // Handle folder drops
    if (targetItem.type === 'folder') {
      // If dropping directly on folder (small movement), place inside
      if (Math.abs(dropPoint.y) < 5) {
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetItem.id);
        position = folderChildren.length;
      } else {
        // If dropping with larger movement, place before/after folder
        targetParentId = targetItem.parentId;
        position = targetItem.position + (dropPoint.y > 0 ? 1 : 0);
      }
    } else {
      // Regular file ordering
      targetParentId = targetItem.parentId;
      position = targetItem.position + (dropPoint.y > 0 ? 1 : 0);
    }

    // Get all items in the same parent
    const siblingItems = items.filter(item => item.parentId === targetParentId);

    // Ensure position is within bounds
    position = Math.max(0, Math.min(position, siblingItems.length));

    // Log the move operation for debugging
    console.log('Moving item:', {
      itemId: draggedItem.id,
      name: draggedItem.name,
      from: {
        parentId: draggedItem.parentId,
        position: draggedItem.position
      },
      to: {
        parentId: targetParentId,
        position: position
      }
    });

    // Send update to server
    socketEvents.moveItem({
      itemId: draggedItem.id,
      targetParentId,
      position
    }).catch((error) => {
      console.error('Move failed:', error);
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
