export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg bg-muted/70" />
          <div className="h-4 w-64 rounded-md bg-muted/50" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted/60" />
          <div className="h-9 w-28 rounded-lg bg-muted/60" />
        </div>
      </div>
      <div className="rounded-xl border border-border/60 bg-card p-0 overflow-hidden">
        <div className="h-12 border-b bg-muted/30" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border/40">
            <div className="h-9 w-9 rounded-full bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 rounded-md bg-muted/60" />
              <div className="h-3 w-32 rounded-md bg-muted/40" />
            </div>
            <div className="h-5 w-16 rounded-md bg-muted/50" />
            <div className="h-5 w-16 rounded-md bg-muted/50" />
            <div className="h-8 w-8 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded-md bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-lg bg-muted/60" />
          <div className="h-9 w-9 rounded-lg bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
