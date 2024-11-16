import { z } from "zod";

export const itemIconSchema = z.enum([
  "FileText",
  "Folder",
  "Image",
  "Video",
  "Music",
  "Code",
  "Archive"
]);

export interface Item {
  id: number;
  name: string;
  type: string;
  icon: string;
  parentId: number | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
