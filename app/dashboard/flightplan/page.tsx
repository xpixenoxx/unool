import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FlightPlanClientWrapper } from './FlightPlanClientWrapper';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Flight Plan — Unool',
  description: 'Plan and schedule your weekly content across all connected platforms.',
};

function FlightPlanSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <style>{`
        @keyframes biscuitPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
        <div className="space-y-2">
          <div className="w-36 h-8 rounded-lg bg-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
          <div className="w-64 h-4 rounded-md bg-[#FAF7F2] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-9 rounded-xl bg-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
          <div className="w-36 h-9 rounded-xl bg-[#C4A265]/30 animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between px-2">
        <div className="w-48 h-6 rounded-md bg-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EDE7DD]" />
          <div className="w-8 h-8 rounded-lg bg-[#EDE7DD]" />
        </div>
      </div>

      {/* 7-column calendar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
          <div
            key={day}
            className="rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] p-3 min-h-[360px] flex flex-col gap-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#FAF7F2]">
              <span className="text-xs font-semibold text-[#8B7355]">{day}</span>
              <div className="w-5 h-5 rounded-full bg-[#EDE7DD] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
            </div>
            {idx % 2 === 0 ? (
              <div className="rounded-xl border border-[#EDE7DD] bg-[#FAF7F2] p-2.5 space-y-2">
                <div className="w-16 h-3 rounded bg-[#EDE7DD]" />
                <div className="w-full h-8 rounded bg-[#E8E0D4] animate-[biscuitPulse_1.5s_ease-in-out_infinite]" />
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-4 h-4 rounded-full bg-[#EDE7DD]" />
                  <div className="w-12 h-2.5 rounded bg-[#EDE7DD]" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#EDE7DD] rounded-xl opacity-40">
                <div className="w-6 h-6 rounded-full bg-[#EDE7DD]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function FlightPlanPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<FlightPlanSkeleton />}>
      <FlightPlanClientWrapper userId={auth.userId} workspaceId={auth.workspaceId} />
    </Suspense>
  );
}
