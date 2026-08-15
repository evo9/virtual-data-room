import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b p-4">
      <span className="text-sm font-medium">{user?.name ?? user?.email}</span>
      <Button variant="outline" size="sm" onClick={logout}>
        Sign out
      </Button>
    </header>
  );
}
