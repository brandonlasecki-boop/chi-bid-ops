import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchContractWithForms } from '@/app/actions/contracts';
import { fetchAssigneesAction } from '@/app/actions/assignees';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ContractStatusBadge } from '@/components/ui/StatusBadge';
import { FormsSection } from '@/components/forms/FormsSection';
import { SamDataSection } from '@/components/contracts/SamDataSection';
import { DeleteContractButton } from '@/components/contracts/DeleteContractButton';
import { mapDocumentsByFormForClient, mapFormForClient, toClientJson } from '@/lib/serialize';

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
  const resolved = await Promise.resolve(params);
  const id = typeof resolved?.id === 'string' ? resolved.id.trim() : '';
  if (!id) notFound();

  let data: Awaited<ReturnType<typeof fetchContractWithForms>>;
  try {
    data = await fetchContractWithForms(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load contract';
    return (
      <div className="rounded-lg border border-rose-700/50 bg-rose-950/30 p-6">
        <h1 className="text-lg font-semibold text-rose-200 mb-2">Could not load this contract</h1>
        <p className="text-sm text-rose-200/90 mb-4">{message}</p>
        <p className="text-sm text-slate-400 mb-4">
          Common causes: missing or invalid <code className="bg-slate-800 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> on
          the server, a database error, or a migration that has not been applied.
        </p>
        <Link href="/" className="text-emerald-400 hover:underline text-sm">
          ← Back to contracts
        </Link>
      </div>
    );
  }

  if (!data) notFound();
  const assignees = (await fetchAssigneesAction().catch(() => [])) ?? [];

  let samDataForClient: Record<string, unknown> | null = null;
  if (data.sam_data && typeof data.sam_data === 'object') {
    try {
      samDataForClient = toClientJson(data.sam_data);
    } catch {
      samDataForClient = null;
    }
  }

  const progressValue = Number(data.progress ?? 0);
  const progressSafe = Number.isFinite(progressValue) ? progressValue : 0;

  const formsForClient = data.forms.map(mapFormForClient);
  const documentsForClient = mapDocumentsByFormForClient(data.documentsByForm);
  const assigneesForClient = assignees.map((a) => ({
    id: String(a.id),
    name: String(a.name),
    email: String(a.email),
  }));

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

        {data.slack_channel_id && data.slack_project_seq != null && (
          <div className="mt-4">
            <span className="text-slate-500 text-sm block mb-1">Slack project channel</span>
            <a
              href={`https://slack.com/app_redirect?channel=${data.slack_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-mono"
            >
              #{`chi-contract-${String(data.slack_project_seq).padStart(3, '0')}`}
            </a>
          </div>
        )}

        <div className="mt-6">
          <span className="text-sm text-slate-500 block mb-2">Progress</span>
          <ProgressBar value={progressSafe} />
        </div>
      </div>

      {samDataForClient && Object.keys(samDataForClient).length > 0 && (
        <SamDataSection samData={samDataForClient} />
      )}

      <FormsSection
        contractId={String(data.id)}
        forms={formsForClient}
        assignees={assigneesForClient}
        documentsByForm={documentsForClient}
      />
    </div>
  );
}
