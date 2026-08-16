import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { fetchPublicFileViewUrl, type PublicShareSummary } from "@/features/sharing/api";

interface PublicFileCardProps {
  token: string;
  summary: PublicShareSummary;
}

export function PublicFileCard({ token, summary }: PublicFileCardProps) {
  const downloadMutation = useMutation({
    mutationFn: () => fetchPublicFileViewUrl(token, summary.resourceId),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not get a download link"));
    },
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <FileTextIcon className="size-10 text-muted-foreground" />
      <div>
        <p className="text-base font-medium">{summary.resourceName}</p>
        {typeof summary.size === "number" && (
          <p className="text-sm text-muted-foreground">{formatBytes(summary.size)}</p>
        )}
      </div>
      <Button disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
        <DownloadIcon /> {downloadMutation.isPending ? "Preparing..." : "Download"}
      </Button>
    </div>
  );
}
