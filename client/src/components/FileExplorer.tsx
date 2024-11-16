import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { FolderList } from "./FolderList";
import { socketEvents } from "../lib/socket";
import type { Item } from "../types/schema";

interface FileExplorerProps {
  items: Item[];
}

export function FileExplorer({ items }: FileExplorerProps) {
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceId = parseInt(result.draggableId);
    const targetParentId = result.destination.droppableId === "root" 
      ? null 
      : parseInt(result.destination.droppableId);
    const position = result.destination.index;

    socketEvents.moveItem({
      itemId: sourceId,
      targetParentId,
      position
    });
  };

  const rootItems = items.filter(item => !item.parentId);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="root">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            <FolderList items={rootItems} level={0} allItems={items} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
