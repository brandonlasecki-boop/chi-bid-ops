import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-semibold text-slate-100 shrink-0">
          CHI Bid Ops
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-100 transition-colors">
            Contracts
          </Link>
          <Link
            href="/contracts/new"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            New project
          </Link>
        </nav>
      </div>
    </header>
  );
}
