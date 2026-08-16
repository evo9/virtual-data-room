import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ResourceType } from "@/features/sharing/api";
import { useShares } from "@/features/sharing/hooks";
import { PeopleAccessSection } from "@/features/sharing/components/people-access-section";
import { PublicLinkSection } from "@/features/sharing/components/public-link-section";
import { ShareDialogSkeleton } from "@/features/sharing/components/share-dialog-skeleton";

interface ShareDialogProps {
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ resourceType, resourceId, resourceName, open, onOpenChange }: ShareDialogProps) {
  const sharesQuery = useShares(resourceType, resourceId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{resourceName}"</DialogTitle>
        </DialogHeader>

        {sharesQuery.isPending && <ShareDialogSkeleton />}

        {sharesQuery.isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">Could not load sharing settings.</p>
            <Button variant="outline" size="sm" onClick={() => sharesQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {sharesQuery.isSuccess && (
          <div className="flex flex-col gap-5">
            <PublicLinkSection resourceType={resourceType} resourceId={resourceId} shares={sharesQuery.data} />
            <div className="border-t pt-4">
              <PeopleAccessSection resourceType={resourceType} resourceId={resourceId} shares={sharesQuery.data} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
