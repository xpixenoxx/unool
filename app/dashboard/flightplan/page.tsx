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
    <div className="max-w-[1180px] mx-auto px-2 py-4 space-y-6">
      <style>{`
        @keyframes parchmentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div className="space-y-2">
          <div className="w-40 h-9 rounded-lg bg-[#E3D6C9] animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
          <div className="w-72 h-4 rounded-md bg-[#F0E7DD] animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="w-36 h-10 rounded-full bg-[#6B1F33]/25 animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Switches & Nav */}
      <div className="flex items-center gap-3">
        <div className="w-48 h-9 rounded-full bg-[#E3D6C9] animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
        <div className="w-32 h-9 rounded-full bg-[#E3D6C9] animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Stage skeleton */}
      <div className="rounded-[26px] p-8 h-[360px] bg-gradient-to-br from-[#4A1624] to-[#2A0B14] flex flex-col justify-between shadow-xl">
        <div className="flex justify-between items-center">
          <div className="w-48 h-6 rounded bg-white/10 animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
          <div className="w-32 h-8 rounded bg-white/10 animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="w-full h-32 rounded-xl bg-white/5 animate-[parchmentPulse_1.5s_ease-in-out_infinite]" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex-1 h-10 rounded-lg bg-white/10" />
          ))}
        </div>
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
