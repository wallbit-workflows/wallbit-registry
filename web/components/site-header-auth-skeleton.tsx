import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

/** Placeholder while Clerk session loads (matches signed-in nav layout). */
export function SiteHeaderAuthSkeleton() {
  return (
    <div className="flex items-center gap-0.5" aria-busy="true">
      <LoadingStatus label="Loading navigation" />
      <Skeleton className="h-9 w-[4.75rem] rounded-full bg-fire-orange/15" />
      <Skeleton className="ml-1 h-9 w-9 shrink-0 rounded-full" />
    </div>
  );
}

/** Placeholder for signed-out nav (Sign in + Publish). */
export function SiteHeaderAuthSkeletonSignedOut() {
  return (
    <div className="flex items-center gap-0.5" aria-busy="true">
      <LoadingStatus label="Loading navigation" />
      <Skeleton className="h-9 w-[4.25rem] rounded-full" />
      <Skeleton className="h-9 w-[4.75rem] rounded-full bg-fire-orange/15" />
    </div>
  );
}
