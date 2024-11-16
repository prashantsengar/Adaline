import { DragDropContext, Droppable, type DropResult } from "react-beautiful-dnd";
import { FolderList } from "./FolderList";
import { socketEvents } from "../lib/socket";
import type { Item } from "../types/schema";

interface FileExplorerProps {
  items: Item[];
}

export function FileExplorer({ items }: FileExplorerProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceId = parseInt(result.draggableId);
    const sourceParentId = result.source.droppableId === "root" ? null : parseInt(result.source.droppableId);
    const targetParentId = result.destination.droppableId === "root" ? null : parseInt(result.destination.droppableId);
    const newPosition = result.destination.index;

    // Only emit if there's an actual change
    if (sourceParentId !== targetParentId || result.source.index !== newPosition) {
      socketEvents.moveItem({
        itemId: sourceId,
        targetParentId,
        position: newPosition
      });
    }
  };

  const rootItems = items.filter(item => !item.parentId);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="root">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 p-4 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-gray-100" : ""
            }`}
          >
            <FolderList items={rootItems} level={0} allItems={items} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
