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
}

export function FileItem({ item, level, children, isOpen, onToggle, isDragging }: FileItemProps) {
  console.log('Icon name:', item.icon);
  console.log('Available icons:', Object.keys(Icons));
  
  const Icon = Icons[item.icon as keyof typeof Icons] || Icons.File;

  return (
    <div>
      <div
        className={cn(
          "flex items-center p-2 rounded-lg",
          "cursor-pointer select-none transition-all duration-200",
          level > 0 && "ml-6",
          isDragging ? "bg-primary/10 shadow-lg scale-105" : "hover:bg-gray-100",
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
