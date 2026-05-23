import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className = "", ...props }: Props) {
  return (
    <div
      className={`animate-pulse rounded-md bg-black/[0.06] ${className}`.trim()}
      aria-hidden
      {...props}
    />
  );
}

export function LoadingStatus({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {label}
    </span>
  );
}
