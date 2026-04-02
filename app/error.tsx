'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error.digest ?? '—';

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-semibold text-slate-100">Something went wrong</h2>
      <p className="text-slate-400 text-sm max-w-md text-center">
        {error.message || 'Production hides the underlying message. See the digest below or open DevTools → Console.'}
      </p>
      <p className="text-slate-500 text-xs font-mono max-w-lg break-all text-center">
        Digest: {digest}
      </p>
      <p className="text-slate-500 text-xs max-w-md text-center">
        Run <code className="bg-slate-800 px-1 rounded">npm run dev</code> locally to see the full server error in the terminal.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
