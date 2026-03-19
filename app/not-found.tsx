import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-slate-100">404 - Page not found</h1>
      <p className="text-slate-400">The page you're looking for doesn't exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
      >
        Back
      </Link>
    </div>
  );
}
