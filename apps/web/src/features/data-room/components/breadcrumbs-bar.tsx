import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BreadcrumbFolder } from "@/features/data-room/api";

interface BreadcrumbsBarProps {
  dataRoomName: string;
  folders: BreadcrumbFolder[];
}

export function BreadcrumbsBar({ dataRoomName, folders }: BreadcrumbsBarProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
      <Crumb to="/" isCurrent={folders.length === 0}>
        {dataRoomName}
      </Crumb>
      {folders.map((folder, index) => (
        <Fragment key={folder.id}>
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
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
