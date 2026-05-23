import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export function AccountSettingsSkeleton() {
  return (
    <div className="stack-lg max-w-lg" aria-busy="true">
      <LoadingStatus label="Loading account settings" />

      <section className="feature-card stack-sm">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <div className="stack-sm">
          <Skeleton className="h-4 w-full max-w-md rounded" />
          <Skeleton className="h-4 w-[85%] max-w-sm rounded" />
        </div>
        <div className="stack-sm pt-1">
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-10 w-full rounded-[var(--radius-inputs)]" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-3 w-56 max-w-full rounded" />
      </section>

      <section className="feature-card stack-sm">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="stack-sm">
          <Skeleton className="h-4 w-full max-w-lg rounded" />
          <Skeleton className="h-4 w-[60%] max-w-xs rounded" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-[var(--radius-inputs)]" />
        <Skeleton className="h-12 w-28 rounded-full" />
      </section>
    </div>
  );
}
