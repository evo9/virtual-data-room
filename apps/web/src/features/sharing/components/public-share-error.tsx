interface PublicShareErrorProps {
  revoked: boolean;
}

export function PublicShareError({ revoked }: PublicShareErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-base font-medium">{revoked ? "This link has been revoked" : "Link not available"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {revoked
          ? "This link has been revoked. Ask the owner for a new one."
          : "This link is invalid or no longer available."}
      </p>
    </div>
  );
}
