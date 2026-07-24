import { Suspense } from 'react';
import PublishContent from './PublishContent';

export const dynamic = 'force-dynamic';

export default function PublishPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Publish (One Click)</h1>
            <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
          </div>
        </div>
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    }>
      <PublishContent />
    </Suspense>
  );
}