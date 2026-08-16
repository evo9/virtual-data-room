import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ChevronRightIcon, DatabaseIcon, DownloadIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getFileDownloadUrl } from "@/features/data-room/api";
import type { ReceivedShare } from "@/features/sharing/api";

interface ReceivedShareRowProps {
  share: ReceivedShare;
}

const RESOURCE_ICON = {
  DATAROOM: DatabaseIcon,
  FOLDER: FolderIcon,
  FILE: FileTextIcon,
} as const;

export function ReceivedShareRow({ share }: ReceivedShareRowProps) {
  const Icon = RESOURCE_ICON[share.resourceType];

  const downloadMutation = useMutation({
    mutationFn: () => getFileDownloadUrl(share.resourceId),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not get a download link"));
    },
  });

  const rowContent = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{share.resourceName}</span>
          <span className="text-xs text-muted-foreground">Shared {formatDate(share.sharedAt)}</span>
        </div>
      </div>

      {share.resourceType === "FILE" && (
        <Button variant="outline" size="sm" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
          <DownloadIcon /> {downloadMutation.isPending ? "Preparing..." : "Download"}
        </Button>
      )}
    </>
  );

  // A direct file share has no view route - Download stays the only
  // interaction rather than a click that surprises the user with a
  // download. Rooms and folders open like any row in the main table.
  if (share.resourceType === "FILE") {
    return <div className="flex items-center justify-between gap-3 rounded-lg border p-3">{rowContent}</div>;
  }

  const target = share.resourceType === "DATAROOM" ? `/room/${share.resourceId}` : `/folder/${share.resourceId}`;

  return (
    <Link
      to={target}
      className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      {rowContent}
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
