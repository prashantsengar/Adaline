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

    // Get the target element's bounding rectangle
    const overElement = document.querySelector(`[data-id="${over.id}"]`);
    if (!overElement) return;

    const rect = overElement.getBoundingClientRect();
    const mouseY = event.activatorEvent.clientY;
    
    // Calculate relative position within the target element
    const relativeY = mouseY - rect.top;
    const relativePercentage = relativeY / rect.height;

    let targetParentId = targetItem.parentId;
    let position;

    // Handle folder targets
    if (targetItem.type === 'folder') {
      // Three zones: top (0-30%), middle (30-70%), bottom (70-100%)
      if (relativePercentage > 0.3 && relativePercentage < 0.7) {
        // Drop inside folder
        targetParentId = targetItem.id;
        const folderChildren = items.filter(item => item.parentId === targetItem.id);
        position = folderChildren.length;
      } else {
        // Drop above or below folder
        targetParentId = targetItem.parentId;
        const siblings = items.filter(item => item.parentId === targetParentId);
        const targetIndex = siblings.findIndex(item => item.id === targetItem.id);
        position = relativePercentage <= 0.3 ? targetIndex : targetIndex + 1;
      }
    } else {
      // Handle file targets
      targetParentId = targetItem.parentId;
      const siblings = items.filter(item => item.parentId === targetParentId);
      const targetIndex = siblings.findIndex(item => item.id === targetItem.id);
      position = relativePercentage <= 0.5 ? targetIndex : targetIndex + 1;
    }

    // Update the dragged item's parent and position
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
