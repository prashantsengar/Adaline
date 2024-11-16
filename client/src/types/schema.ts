import { z } from "zod";

export const itemIconSchema = z.enum([
  "file-text",
  "folder",
  "image",
  "video",
  "music",
  "code",
  "archive"
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
