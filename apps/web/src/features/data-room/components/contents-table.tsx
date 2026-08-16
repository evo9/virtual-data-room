import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FileTextIcon, FolderIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import { getFileDownloadUrl, type FileItem, type FolderItem } from "@/features/data-room/api";
import type { ContentsQuery } from "@/features/data-room/hooks";
import { ContentsRowsSkeleton, ContentsTableSkeleton } from "@/features/data-room/components/contents-table-skeleton";
import { DeleteFileDialog } from "@/features/data-room/components/delete-file-dialog";
import { DeleteFolderDialog } from "@/features/data-room/components/delete-folder-dialog";
import { EmptyFolderState } from "@/features/data-room/components/empty-folder-state";
import { FileRowMenu } from "@/features/data-room/components/file-row-menu";
import { FolderRowMenu } from "@/features/data-room/components/folder-row-menu";
import { MoveFileDialog } from "@/features/data-room/components/move-file-dialog";
import { RenameFileDialog } from "@/features/data-room/components/rename-file-dialog";
import { RenameFolderDialog } from "@/features/data-room/components/rename-folder-dialog";
import { useIntersectionObserver } from "@/features/data-room/use-intersection-observer";

interface ContentsTableProps {
  dataRoomId: string;
  folderId: string | null;
  query: ContentsQuery;
  onCreateFolder: () => void;
  onUploadClick: () => void;
}

export function ContentsTable({ dataRoomId, folderId, query, onCreateFolder, onUploadClick }: ContentsTableProps) {
  const navigate = useNavigate();
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);
  const [renameFileTarget, setRenameFileTarget] = useState<FileItem | null>(null);
  const [moveFileTarget, setMoveFileTarget] = useState<FileItem | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileItem | null>(null);

  const downloadMutation = useMutation({
    mutationFn: (fileId: string) => getFileDownloadUrl(fileId),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not get a download link"));
    },
  });

  const { isPending, isError, data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;

  const sentinelRef = useIntersectionObserver<HTMLTableRowElement>(
    () => {
      if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
    },
    hasNextPage,
    data?.pages.length
  );

  if (isPending) {
    return <ContentsTableSkeleton />;
  }

  if (isError && !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Could not load this folder's contents.</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const items = data.pages.flatMap((page) => page.items);

  if (items.length === 0 && !hasNextPage) {
    return <EmptyFolderState onCreateFolder={onCreateFolder} onUploadClick={onUploadClick} />;
  }

  const canLoadMore = hasNextPage && !isFetchNextPageError;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) =>
            item.type === "folder" ? (
              <FolderRow
                key={item.id}
                folder={item}
                onOpen={() => navigate(`/folder/${item.id}`)}
                onRename={() => setRenameTarget(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ) : (
              <FileRow
                key={item.id}
                file={item}
                downloadPending={downloadMutation.isPending && downloadMutation.variables === item.id}
                onRename={() => setRenameFileTarget(item)}
                onMove={() => setMoveFileTarget(item)}
                onDownload={() => downloadMutation.mutate(item.id)}
                onDelete={() => setDeleteFileTarget(item)}
              />
            )
          )}

          {isFetchingNextPage && <ContentsRowsSkeleton />}

          {hasNextPage && (
            <TableRow ref={sentinelRef} className="hover:bg-transparent">
              <TableCell colSpan={4} className="h-1 p-0" />
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col items-center gap-2 py-2">
        {isFetchNextPageError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Could not load more items.</span>
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
              Retry
            </Button>
          </div>
        )}

        {canLoadMore && (
          <Button variant="outline" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        )}
      </div>

      <RenameFolderDialog
        folder={renameTarget}
        listingFolderId={folderId}
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      />
      <DeleteFolderDialog
        folder={deleteTarget}
        listingFolderId={folderId}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
      <RenameFileDialog
        file={renameFileTarget}
        listingFolderId={folderId}
        open={renameFileTarget !== null}
        onOpenChange={(open) => !open && setRenameFileTarget(null)}
      />
      <MoveFileDialog
        file={moveFileTarget}
        dataRoomId={dataRoomId}
        open={moveFileTarget !== null}
        onOpenChange={(open) => !open && setMoveFileTarget(null)}
      />
      <DeleteFileDialog
        file={deleteFileTarget}
        listingFolderId={folderId}
        open={deleteFileTarget !== null}
        onOpenChange={(open) => !open && setDeleteFileTarget(null)}
      />
    </>
  );
}

function FolderRow({
  folder,
  onOpen,
  onRename,
  onDelete,
}: {
  folder: FolderItem;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-medium">
        <span className="flex items-center gap-2">
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          {folder.name}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">—</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(folder.createdAt)}</TableCell>
      <TableCell className="text-right">
        <FolderRowMenu folderName={folder.name} onRename={onRename} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

function FileRow({
  file,
  downloadPending,
  onRename,
  onMove,
  onDownload,
  onDelete,
}: {
  file: FileItem;
  downloadPending: boolean;
  onRename: () => void;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="flex items-center gap-2">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          {file.name}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatBytes(file.size)}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(file.createdAt)}</TableCell>
      <TableCell className="text-right">
        <FileRowMenu
          fileName={file.name}
          downloadPending={downloadPending}
          onRename={onRename}
          onMove={onMove}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
