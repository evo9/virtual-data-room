import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function FolderNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-base font-medium">Folder not found</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This folder does not exist, or you don't have access to it.
      </p>
      <Button render={<Link to="/" />} variant="outline">
        Back to data room
      </Button>
    </div>
  );
}
