import { Draggable, Droppable } from "react-beautiful-dnd";
import { FileItem } from "./FileItem";
import type { Item } from "../types/schema";

interface FolderListProps {
  items: Item[];
  level: number;
  allItems: Item[];
}

export function FolderList({ items, level, allItems }: FolderListProps) {
  return (
    <>
      {items.map((item, index) => (
        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <FileItem
                item={item}
                level={level}
              >
                {item.type === "folder" && (
                  <Droppable droppableId={item.id.toString()}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="ml-6 mt-2"
                      >
                        <FolderList
                          items={allItems.filter(i => i.parentId === item.id)}
                          level={level + 1}
                          allItems={allItems}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </FileItem>
            </div>
          )}
        </Draggable>
      ))}
    </>
  );
}
