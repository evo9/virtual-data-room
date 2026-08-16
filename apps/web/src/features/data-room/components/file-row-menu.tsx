import { DownloadIcon, FolderInputIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileRowMenuProps {
  fileName: string;
  downloadPending: boolean;
  onRename: () => void;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function FileRowMenu({ fileName, downloadPending, onRename, onMove, onDownload, onDelete }: FileRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${fileName}`} />}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onClick={onRename}>
          <PencilIcon /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <FolderInputIcon /> Move
        </DropdownMenuItem>
        <DropdownMenuItem disabled={downloadPending} onClick={onDownload}>
          <DownloadIcon /> {downloadPending ? "Preparing..." : "Download"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
