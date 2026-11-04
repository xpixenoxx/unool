'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Admin Error]', error); }, [error]);
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold">Admin page error</h2>
        <p className="text-gray-500 text-sm">{error.message || 'An error occurred in the admin panel.'}</p>
        <Button onClick={reset}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
      </div>
    </div>
  );
}

