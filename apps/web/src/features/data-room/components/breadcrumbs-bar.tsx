import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BreadcrumbFolder } from "@/features/data-room/api";

interface BreadcrumbsBarProps {
  // Null when the viewer reached this folder through a share whose
  // boundary sits below the room root - the room itself isn't a resource
  // they have access to, so there is no "/" crumb to link back to.
  dataRoomName: string | null;
  folders: BreadcrumbFolder[];
}

export function BreadcrumbsBar({ dataRoomName, folders }: BreadcrumbsBarProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
      {dataRoomName !== null && (
        <>
          <Crumb to="/" isCurrent={folders.length === 0}>
            {dataRoomName}
          </Crumb>
          {folders.length > 0 && <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />}
        </>
      )}
      {folders.map((folder, index) => (
        <Fragment key={folder.id}>
          {index > 0 && <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />}
          <Crumb to={`/folder/${folder.id}`} isCurrent={index === folders.length - 1}>
            {folder.name}
          </Crumb>
        </Fragment>
      ))}
    </nav>
  );
}

function Crumb({ to, isCurrent, children }: { to: string; isCurrent: boolean; children: ReactNode }) {
  if (isCurrent) {
    return <span className="truncate font-medium text-foreground">{children}</span>;
  }

  return (
    <Link
      to={to}
      className={cn("truncate text-muted-foreground hover:text-foreground hover:underline")}
    >
      {children}
    </Link>
  );
}
