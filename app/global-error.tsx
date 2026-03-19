'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <p className="text-slate-400 mb-6">{error.message}</p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
