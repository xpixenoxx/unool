import { Suspense } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { EmailLoginForm } from './EmailLoginForm';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <Shield className="h-8 w-8" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailLoginForm />
    </Suspense>
  );
}
