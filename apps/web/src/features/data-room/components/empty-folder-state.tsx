import { FolderIcon, FolderPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyFolderStateProps {
  onCreateFolder: () => void;
}

export function EmptyFolderState({ onCreateFolder }: EmptyFolderStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <FolderIcon className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">This folder is empty</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Create a folder to start organizing this data room.
      </p>
      <Button variant="outline" size="sm" onClick={onCreateFolder}>
        <FolderPlusIcon /> New folder
      </Button>
    </div>
  );
}
