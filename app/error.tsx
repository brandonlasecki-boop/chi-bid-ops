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

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-slate-100">Something went wrong</h2>
      <p className="text-slate-400 text-sm max-w-md text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
