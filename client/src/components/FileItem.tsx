import { useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "../types/schema";

interface FileItemProps {
  item: Item;
  level: number;
  children?: React.ReactNode;
}

export function FileItem({ item, level, children }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  console.log('Icon name:', item.icon);
  console.log('Available icons:', Object.keys(Icons));
  
  const Icon = Icons[item.icon as keyof typeof Icons] || Icons.File;

  return (
    <div>
      <div
        className={cn(
          "flex items-center p-2 rounded-lg hover:bg-gray-100",
          "cursor-pointer select-none",
          level > 0 && "ml-6"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {item.type === "folder" && (
          <Icons.ChevronRight
            className={cn(
              "w-4 h-4 mr-1 transition-transform",
              isOpen && "transform rotate-90"
            )}
          />
        )}
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">{item.name}</span>
      </div>
      {isOpen && children}
    </div>
  );
}
