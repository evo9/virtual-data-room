import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileTextIcon, FolderIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes, formatDate } from "@/lib/format";
import type { FileItem, FolderItem } from "@/features/data-room/api";
import type { ContentsQuery } from "@/features/data-room/hooks";
import { ContentsRowsSkeleton, ContentsTableSkeleton } from "@/features/data-room/components/contents-table-skeleton";
import { DeleteFolderDialog } from "@/features/data-room/components/delete-folder-dialog";
import { EmptyFolderState } from "@/features/data-room/components/empty-folder-state";
import { FolderRowMenu } from "@/features/data-room/components/folder-row-menu";
import { RenameFolderDialog } from "@/features/data-room/components/rename-folder-dialog";
import { useIntersectionObserver } from "@/features/data-room/use-intersection-observer";

interface ContentsTableProps {
  folderId: string | null;
  query: ContentsQuery;
  onCreateFolder: () => void;
  onUploadClick: () => void;
}

export function ContentsTable({ folderId, query, onCreateFolder, onUploadClick }: ContentsTableProps) {
  const navigate = useNavigate();
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);

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
              <FileRow key={item.id} file={item} />
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

function FileRow({ file }: { file: FileItem }) {
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
      <TableCell />
    </TableRow>
  );
}
