import { AppHeader } from "@/components/app-header";
import { PageLoadError } from "@/components/page-load-error";
import { NoReceivedSharesState } from "@/features/sharing/components/no-received-shares-state";
import { ReceivedShareRow } from "@/features/sharing/components/received-share-row";
import { ReceivedSharesSkeleton } from "@/features/sharing/components/received-shares-skeleton";
import { useReceivedShares } from "@/features/sharing/hooks";

export function SharedWithMePage() {
  const sharesQuery = useReceivedShares();

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-lg font-semibold">Shared with me</h1>

        {sharesQuery.isPending && <ReceivedSharesSkeleton />}

        {sharesQuery.isError && (
          <PageLoadError message="Could not load what's been shared with you." onRetry={() => sharesQuery.refetch()} />
        )}

        {sharesQuery.isSuccess &&
          (sharesQuery.data.length === 0 ? (
            <NoReceivedSharesState />
          ) : (
            <div className="flex flex-col gap-2">
              {sharesQuery.data.map((share) => (
                <ReceivedShareRow key={share.shareId} share={share} />
              ))}
            </div>
          ))}
      </main>
    </div>
  );
}
