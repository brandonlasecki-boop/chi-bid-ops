'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Contract detail error:', error);
  }, [error]);

  const digest = error.digest ?? '—';

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-semibold text-slate-100">Could not load contract</h2>
      <p className="text-slate-400 text-sm max-w-md text-center">
        {error.message || 'Production hides the underlying message. Check DevTools → Console or run npm run dev.'}
      </p>
      <p className="text-slate-500 text-xs font-mono max-w-lg break-all text-center">Digest: {digest}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg text-sm font-medium"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
