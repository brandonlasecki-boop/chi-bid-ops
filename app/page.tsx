import Link from 'next/link';
import { fetchContracts } from '@/app/actions/contracts';
import type { Contract } from '@/types';

export const dynamic = 'force-dynamic';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ContractStatusBadge } from '@/components/ui/StatusBadge';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString();
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export default async function DashboardPage() {
  let contracts: Contract[] = [];
  let dbError: string | null = null;

  try {
    contracts = await fetchContracts();
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Failed to connect to database';
    contracts = [];
  }

  if (dbError) {
    return (
      <div className="rounded-lg border border-amber-600/50 bg-amber-950/30 p-6">
        <h2 className="text-lg font-semibold text-amber-200 mb-2">Can&apos;t connect to database</h2>
        <p className="text-amber-200/80 text-sm mb-4">{dbError}</p>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Check <code className="bg-slate-800 px-1 rounded">.env.local</code> has correct Supabase URL and keys</li>
          <li>Run migrations in Supabase SQL Editor: <code className="bg-slate-800 px-1 rounded">001_initial_schema.sql</code> and <code className="bg-slate-800 px-1 rounded">002_progress_function.sql</code></li>
          <li>If tables exist, check Supabase project is not paused</li>
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Contracts</h1>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          New Contract
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-12 text-center">
          <p className="text-slate-400 mb-4">No contracts yet.</p>
          <Link
            href="/contracts/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Contract
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="block rounded-lg border border-slate-700 bg-slate-900/50 p-5 hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-slate-100 truncate">
                    {contract.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">{contract.agency}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm ${
                      isOverdue(contract.due_date) ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    Due {formatDate(contract.due_date)}
                  </span>
                  <ContractStatusBadge status={contract.status} />
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={contract.progress} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
