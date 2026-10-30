export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading admin dashboard...">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg bg-muted/70" />
          <div className="h-4 w-72 rounded-md bg-muted/50" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 rounded-lg bg-muted/60" />
          <div className="h-9 w-28 rounded-lg bg-muted/60" />
          <div className="h-9 w-32 rounded-lg bg-muted/60" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div>
        <div className="h-4 w-32 rounded-md bg-muted/50 mb-3" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded-md bg-muted/60" />
                <div className="h-5 w-5 rounded-md bg-muted/60" />
              </div>
              <div className="h-8 w-20 rounded-md bg-muted/80" />
              <div className="h-3 w-16 rounded-md bg-muted/40" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="h-6 w-40 rounded-md bg-muted/70" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted/60" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded-md bg-muted/60" />
                    <div className="h-3 w-20 rounded-md bg-muted/40" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-md bg-muted/50" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="h-6 w-40 rounded-md bg-muted/70" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted/60" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded-md bg-muted/60" />
                    <div className="h-3 w-20 rounded-md bg-muted/40" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-md bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
