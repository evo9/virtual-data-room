import { useState } from "react";
import { FolderPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BreadcrumbFolder } from "@/features/data-room/api";
import { BreadcrumbsBar } from "@/features/data-room/components/breadcrumbs-bar";
import { ContentsTable } from "@/features/data-room/components/contents-table";
import { CreateFolderDialog } from "@/features/data-room/components/create-folder-dialog";
import { useFolderContents } from "@/features/data-room/hooks";

interface FolderExplorerProps {
  dataRoomId: string;
  dataRoomName: string;
  folderId: string | null;
  breadcrumbFolders: BreadcrumbFolder[];
}

export function FolderExplorer({ dataRoomId, dataRoomName, folderId, breadcrumbFolders }: FolderExplorerProps) {
  const contentsQuery = useFolderContents(dataRoomId, folderId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BreadcrumbsBar dataRoomName={dataRoomName} folders={breadcrumbFolders} />
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <FolderPlusIcon /> New folder
        </Button>
      </div>

      <ContentsTable folderId={folderId} query={contentsQuery} onCreateFolder={() => setCreateOpen(true)} />

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} dataRoomId={dataRoomId} parentId={folderId} />
    </div>
  );
}
