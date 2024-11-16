import { Draggable, Droppable } from "react-beautiful-dnd";
import { FileItem } from "./FileItem";
import type { Item } from "../types/schema";
import { useState } from "react";

interface FolderListProps {
  items: Item[];
  level: number;
  allItems: Item[];
}

export function FolderList({ items, level, allItems }: FolderListProps) {
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({});

  const toggleFolder = (folderId: number) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <>
      {items.map((item, index) => {
        // Add debug logging
        console.log('Draggable item:', { 
          id: item.id, 
          draggableId: `item-${item.id}`,
          index 
        });

        return (
          <Draggable 
            key={`item-${item.id}`} 
            draggableId={`item-${item.id}`} 
            index={index}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`transition-transform duration-200 ${
                  snapshot.isDragging ? "scale-105" : ""
                }`}
              >
                <FileItem
                  item={item}
                  level={level}
                  isOpen={openFolders[item.id] ?? true}
                  onToggle={() => toggleFolder(item.id)}
                  isDragging={snapshot.isDragging}
                >
                  {item.type === "folder" && (openFolders[item.id] ?? true) && (
                    <Droppable droppableId={`folder-${item.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`ml-6 mt-2 transition-all duration-200 ${
                            snapshot.isDraggingOver 
                              ? "bg-gray-100 rounded-lg p-2" 
                              : "p-2"
                          }`}
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
        );
      })}
    </>
  );
}
