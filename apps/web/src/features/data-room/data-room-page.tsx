import { AppHeader } from "@/components/app-header";

export function DataRoomPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Your data room will appear here soon.
      </main>
    </div>
  );
}
