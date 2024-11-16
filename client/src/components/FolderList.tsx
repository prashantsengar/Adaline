import { Draggable, Droppable } from "react-beautiful-dnd";
import { FileItem } from "./FileItem";
import type { Item } from "../types/schema";
import { useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

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

  // Add debug logging at the top level
  console.log('Rendering FolderList with items:', items.map(item => ({
    id: item.id,
    draggableId: `item-${item.id}`,
    name: item.name
  })));

  return (
    <ErrorBoundary>
      <>
        {items.map((item, index) => {
          // Add debug logging for each draggable
          console.log('Rendering draggable item:', { 
            id: item.id, 
            draggableId: `item-${item.id}`,
            index,
            type: item.type,
            name: item.name
          });

          return (
            <Draggable 
              key={`item-${item.id}`} 
              draggableId={`item-${item.id}`} 
              index={index}
              isDragDisabled={false}
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
                      <Droppable droppableId={`folder-${item.id}`} type="ITEM">
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
    </ErrorBoundary>
  );
}
