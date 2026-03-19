import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchContractWithForms } from '@/app/actions/contracts';
import { fetchAssigneesAction } from '@/app/actions/assignees';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ContractStatusBadge } from '@/components/ui/StatusBadge';
import { FormsTable } from '@/components/forms/FormsTable';
import { FormsSection } from '@/components/forms/FormsSection';
import { SamDataSection } from '@/components/contracts/SamDataSection';
import { DeleteContractButton } from '@/components/contracts/DeleteContractButton';

export const dynamic = 'force-dynamic';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const [data, assigneesResult] = await Promise.all([
    fetchContractWithForms(id),
    fetchAssigneesAction().catch(() => []),
  ]);

  if (!data) notFound();
  const assignees = assigneesResult ?? [];

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-slate-400 hover:text-slate-200 mb-6 inline-block"
      >
        ← Back
      </Link>

      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              {data.title}
            </h1>
            <p className="text-slate-500 mt-1">{data.agency}</p>
          </div>
          <div className="flex items-center gap-4">
            <ContractStatusBadge status={data.status} />
            <DeleteContractButton contractId={data.id} contractTitle={data.title} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Due Date</span>
            <p className="text-slate-200">{formatDate(data.due_date)}</p>
          </div>
          <div>
            <span className="text-slate-500">Contract ID</span>
            <p className="text-slate-400 font-mono text-xs">{data.display_id ?? data.id}</p>
          </div>
          {(data.sam_notice_id || data.solicitation_number) && (
            <>
              {data.sam_notice_id && (
                <div>
                  <span className="text-slate-500">Notice ID</span>
                  <p className="text-slate-400 font-mono text-xs">{data.sam_notice_id}</p>
                </div>
              )}
              {data.solicitation_number && (
                <div>
                  <span className="text-slate-500">Solicitation #</span>
                  <p className="text-slate-200">{data.solicitation_number}</p>
                </div>
              )}
            </>
          )}
        </div>

        {data.sam_url && (
          <a
            href={data.sam_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
          >
            View on SAM.gov →
          </a>
        )}

        <div className="mt-6">
          <span className="text-sm text-slate-500 block mb-2">Progress</span>
          <ProgressBar value={data.progress} />
        </div>
      </div>

      {data.sam_data && (
        <SamDataSection samData={data.sam_data} />
      )}

      <FormsSection
        contractId={data.id}
        forms={data.forms}
        assignees={assignees.map((a) => ({ id: a.id, name: a.name, email: a.email }))}
        documentsByForm={data.documentsByForm ?? {}}
      />
    </div>
  );
}
