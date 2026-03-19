import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-slate-100">
          CHI Bid Ops
        </Link>
      </div>
    </header>
  );
}
