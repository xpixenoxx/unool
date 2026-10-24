export default function DashboardLoading() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D4]">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-xl bg-[#EDE7DD] animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-[#EDE7DD]/60 animate-pulse" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-9 w-28 rounded-xl bg-[#EDE7DD]/70 animate-pulse" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-[#EDE7DD] animate-pulse" />
              <div className="h-6 w-6 rounded-lg bg-[#F5EFE2] animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-[#EDE7DD] animate-pulse" />
            <div className="h-3 w-32 rounded bg-[#EDE7DD]/50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] p-6 space-y-4 shadow-xs min-h-[360px]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 rounded-lg bg-[#EDE7DD] animate-pulse" />
          <div className="h-8 w-24 rounded-xl bg-[#EDE7DD]/70 animate-pulse" />
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-12 w-full rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]/60 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]/60 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-[#FAF7F2] border border-[#E8E0D4]/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
