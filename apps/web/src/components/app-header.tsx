import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b p-4">
      <span className="text-sm font-medium">{user?.name ?? user?.email}</span>
      <nav className="flex items-center gap-3">
        <Link to="/shared-with-me" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          Shared with me
        </Link>
        <Button variant="outline" size="sm" onClick={logout}>
          Sign out
        </Button>
      </nav>
    </header>
  );
}
