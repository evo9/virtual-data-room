import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { FolderPlusIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BreadcrumbFolder } from "@/features/data-room/api";
import { BreadcrumbsBar } from "@/features/data-room/components/breadcrumbs-bar";
import { ContentsTable } from "@/features/data-room/components/contents-table";
import { CreateFolderDialog } from "@/features/data-room/components/create-folder-dialog";
import { useFolderContents } from "@/features/data-room/hooks";
import { UploadPanel } from "@/features/data-room/upload/upload-panel";
import { useUploadQueue } from "@/features/data-room/upload/use-upload-queue";

interface FolderExplorerProps {
  dataRoomId: string;
  dataRoomName: string;
  folderId: string | null;
  breadcrumbFolders: BreadcrumbFolder[];
}

export function FolderExplorer({ dataRoomId, dataRoomName, folderId, breadcrumbFolders }: FolderExplorerProps) {
  const contentsQuery = useFolderContents(dataRoomId, folderId);
  const [createOpen, setCreateOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { tasks, enqueue, retry, clearFinished } = useUploadQueue(dataRoomId, folderId);

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    enqueue(Array.from(event.dataTransfer.files));
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) enqueue(Array.from(event.target.files));
    event.target.value = "";
  }

  return (
    <div
      className="relative flex flex-1 flex-col gap-4 p-6"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BreadcrumbsBar dataRoomName={dataRoomName} folders={breadcrumbFolders} />
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Drag &amp; drop PDF files anywhere to upload
          </span>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon /> Upload
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <FolderPlusIcon /> New folder
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <ContentsTable
        dataRoomId={dataRoomId}
        folderId={folderId}
        query={contentsQuery}
        onCreateFolder={() => setCreateOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} dataRoomId={dataRoomId} parentId={folderId} />

      <UploadPanel tasks={tasks} onRetry={retry} onClose={clearFinished} />

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10">
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-background/95 px-10 py-8 shadow-lg">
            <UploadIcon className="size-8 text-primary" />
            <p className="text-base font-medium">Drop PDF files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
