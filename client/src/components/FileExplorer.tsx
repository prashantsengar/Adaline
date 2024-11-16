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
    
    console.log('Drag end:', { active, over });
    
    if (!over || active.id === over.id) {
      console.log('No valid destination, skipping update');
      return;
    }

    socketEvents.moveItem({
      itemId: active.id,
      targetParentId: over.data?.current?.parentId || null,
      position: over.data?.current?.sortable?.index || 0
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