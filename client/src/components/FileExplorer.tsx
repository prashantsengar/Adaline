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

    // If dropping onto a folder, make it a child of that folder
    if (targetItem.type === 'folder') {
      targetParentId = targetItem.id;
      const folderChildren = items.filter(item => item.parentId === targetParentId);
      position = folderChildren.length; // Place at the end of folder
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
          <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 p-4 rounded-lg">
              <FolderList 
                items={rootItems} 
                level={0} 
                allItems={items} 
              />
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </ErrorBoundary>
  );
}
