import { useParams } from "react-router-dom";

import { AppHeader } from "@/components/app-header";
import { isNotFoundError } from "@/lib/api";
import { DataRoomSkeleton } from "@/features/data-room/components/data-room-skeleton";
import { FolderExplorer } from "@/features/data-room/components/folder-explorer";
import { FolderNotFound } from "@/features/data-room/components/folder-not-found";
import { PageLoadError } from "@/features/data-room/components/page-load-error";
import { useBreadcrumbs } from "@/features/data-room/hooks";

export function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const breadcrumbsQuery = useBreadcrumbs(id ?? "");

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="flex flex-1 flex-col">
        {breadcrumbsQuery.isPending && <DataRoomSkeleton />}

        {breadcrumbsQuery.isError &&
          (isNotFoundError(breadcrumbsQuery.error) ? (
            <FolderNotFound />
          ) : (
            <PageLoadError message="Could not load this folder." onRetry={() => breadcrumbsQuery.refetch()} />
          ))}

        {breadcrumbsQuery.isSuccess && id && (
          <FolderExplorer
            dataRoomId={breadcrumbsQuery.data.dataRoom.id}
            dataRoomName={breadcrumbsQuery.data.dataRoom.name}
            folderId={id}
            breadcrumbFolders={breadcrumbsQuery.data.folders}
          />
        )}
      </main>
    </div>
  );
}
