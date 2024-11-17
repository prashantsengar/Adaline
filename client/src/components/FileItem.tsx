import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "../types/schema";

interface FileItemProps {
  item: Item;
  level: number;
  children?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isDragging?: boolean;
  transform?: string;
  transition?: string;
  isOver?: boolean;
}

export function FileItem({ 
  item, 
  level, 
  children, 
  isOpen, 
  onToggle, 
  isDragging,
  transform,
  transition,
  isOver
}: FileItemProps) {
  const Icon = Icons[item.icon as keyof typeof Icons] || Icons.File;

  const style = {
    transform,
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    animation: isDragging ? 'none' : 'moveIn 200ms ease-out'
  };

  return (
    <div 
      style={style} 
      className={cn(
        "draggable-item relative",
        isDragging && "z-50"
      )}
      data-id={item.id}
    >
      <div
        className={cn(
          "flex items-center p-2 rounded-lg",
          "cursor-pointer select-none transition-all duration-200",
          level > 0 && "ml-6",
          isDragging ? "bg-primary/10 shadow-lg scale-105" : "hover:bg-gray-100",
          item.type === "folder" && "hover:ring-2 hover:ring-primary/50",
          isOver && item.type === "folder" && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={onToggle}
      >
        {item.type === "folder" && (
          <Icons.ChevronRight
            className={cn(
              "w-4 h-4 mr-1 transition-transform duration-200",
              isOpen && "transform rotate-90"
            )}
          />
        )}
        <Icon className={cn(
          "w-4 h-4 mr-2",
          isDragging && "text-primary"
        )} />
        <span className={cn(
          "text-sm font-medium",
          isDragging && "text-primary"
        )}>
          {item.name}
        </span>
      </div>
      {children}
    </div>
  );
}
