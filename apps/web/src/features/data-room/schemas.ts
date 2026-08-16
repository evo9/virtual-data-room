import { z } from "zod";

export const folderNameSchema = z.object({
  name: z.string().trim().min(1, "Enter a folder name").max(200, "Name is too long"),
});

export type FolderNameValues = z.infer<typeof folderNameSchema>;
