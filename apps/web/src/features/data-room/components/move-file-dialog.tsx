import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, FolderIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { moveFile, type FileItem, type FolderNode } from "@/features/data-room/api";
import { contentsKey, useFolders } from "@/features/data-room/hooks";

interface MoveFileDialogProps {
  file: FileItem | null;
  dataRoomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveFileDialog({ file, dataRoomId, open, onOpenChange }: MoveFileDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>();
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelectedFolderId(undefined);
  }

  const rootQuery = useFolders(dataRoomId, null, open);

  const currentFolderId = file?.folderId ?? null;

  const mutation = useMutation({
    mutationFn: (targetFolderId: string | null) => moveFile(file!.id, targetFolderId),
    onSuccess: (updated, targetFolderId) => {
      toast.success(
        updated.name !== file?.name
          ? `Moved and renamed to "${updated.name}" to avoid a naming conflict`
          : `"${updated.name}" moved`
      );
      queryClient.invalidateQueries({ queryKey: contentsKey(currentFolderId) });
      queryClient.invalidateQueries({ queryKey: contentsKey(targetFolderId) });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not move the file"));
    },
  });

  const tree: TreeContext = {
    dataRoomId,
    currentFolderId,
    selectedFolderId,
    onSelect: setSelectedFolderId,
    busy: mutation.isPending,
  };

  const canMove = selectedFolderId !== undefined && selectedFolderId !== currentFolderId;
  const isEmpty = rootQuery.isSuccess && rootQuery.data.length === 0 && currentFolderId === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move "{file?.name}"</DialogTitle>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto rounded-md border">
          {rootQuery.isPending && <p className="p-4 text-sm text-muted-foreground">Loading folders...</p>}

          {rootQuery.isError && (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <p className="text-sm text-muted-foreground">Could not load folders.</p>
              <Button variant="outline" size="sm" onClick={() => rootQuery.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {isEmpty && (
            <p className="p-4 text-sm text-muted-foreground">
              This data room has no other folders yet — create one first to move files into it.
            </p>
          )}

          {rootQuery.isSuccess && !isEmpty && (
            <ul className="py-1">
              <li>
                <div
                  style={{ paddingLeft: "8px" }}
                  className={cn(
                    "flex w-full items-center gap-1 pr-3 hover:bg-accent",
                    selectedFolderId === null && "bg-accent"
                  )}
                >
                  <span className="size-5 shrink-0" />
                  <button
                    type="button"
                    disabled={currentFolderId === null || mutation.isPending}
                    onClick={() => setSelectedFolderId(null)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50",
                      selectedFolderId === null && "font-medium"
                    )}
                  >
                    <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">Root</span>
                    {currentFolderId === null && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </button>
                </div>
              </li>
              {rootQuery.data.map((folder) => (
                <FolderBranch key={folder.id} folder={folder} depth={1} tree={tree} />
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canMove || mutation.isPending}
            onClick={() => mutation.mutate(selectedFolderId ?? null)}
          >
            {mutation.isPending ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TreeContext {
  dataRoomId: string;
  currentFolderId: string | null;
  selectedFolderId: string | null | undefined;
  onSelect: (folderId: string | null) => void;
  busy: boolean;
}

function FolderBranch({ folder, depth, tree }: { folder: FolderNode; depth: number; tree: TreeContext }) {
  const [expanded, setExpanded] = useState(false);
  const childrenQuery = useFolders(tree.dataRoomId, folder.id, expanded);

  const isCurrent = folder.id === tree.currentFolderId;
  const isSelected = tree.selectedFolderId === folder.id;
  const childIndent = `${depth * 16 + 32}px`;

  return (
    <li>
      <div
        style={{ paddingLeft: `${(depth - 1) * 16 + 8}px` }}
        className={cn("flex w-full items-center gap-1 pr-3 hover:bg-accent", isSelected && "bg-accent")}
      >
        {folder.hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
            onClick={() => setExpanded((value) => !value)}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronRightIcon className={cn("size-4 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <button
          type="button"
          disabled={isCurrent || tree.busy}
          onClick={() => tree.onSelect(folder.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50",
            isSelected && "font-medium"
          )}
        >
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{folder.name}</span>
          {isCurrent && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
        </button>
      </div>

      {expanded && childrenQuery.isPending && (
        <p style={{ paddingLeft: childIndent }} className="py-1.5 text-sm text-muted-foreground">
          Loading...
        </p>
      )}

      {expanded && childrenQuery.isError && (
        <div style={{ paddingLeft: childIndent }} className="flex items-center gap-2 py-1">
          <span className="text-sm text-muted-foreground">Could not load subfolders.</span>
          <Button variant="ghost" size="sm" onClick={() => childrenQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {expanded && childrenQuery.isSuccess && childrenQuery.data.length === 0 && (
        <p style={{ paddingLeft: childIndent }} className="py-1.5 text-sm text-muted-foreground">
          No subfolders
        </p>
      )}

      {expanded && childrenQuery.isSuccess && childrenQuery.data.length > 0 && (
        <ul>
          {childrenQuery.data.map((child) => (
            <FolderBranch key={child.id} folder={child} depth={depth + 1} tree={tree} />
          ))}
        </ul>
      )}
    </li>
  );
}
