'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSamDataAction } from '@/app/actions/sam';

interface CreateContractFormProps {
  action: (input: {
    title: string;
    agency: string;
    due_date: string;
    sam_notice_id?: string | null;
    solicitation_number?: string | null;
    sam_url?: string | null;
    sam_data?: Record<string, unknown> | null;
    create_thread?: boolean;
    notes?: string | null;
  }) => Promise<{ id: string }>;
}

// Extract notice ID from SAM.gov URL or return as-is if it's already a raw ID
function parseSamUrlOrId(input: string): { noticeId: string | null; url: string } {
  const trimmed = input?.trim() || '';
  if (!trimmed) return { noticeId: null, url: '' };

  // Match SAM.gov URL patterns: .../opp/{id}/view or .../opp/{id}
  const match = trimmed.match(/\/opp\/([a-f0-9-]{20,})/i);
  if (match) {
    const noticeId = match[1];
    return {
      noticeId,
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    };
  }

  // Raw notice ID (32 hex chars)
  if (/^[a-f0-9-]{20,}$/i.test(trimmed)) {
    return {
      noticeId: trimmed,
      url: `https://sam.gov/opp/${trimmed}/view`,
    };
  }

  return { noticeId: null, url: trimmed.startsWith('http') ? trimmed : '' };
}

export function CreateContractForm({ action }: CreateContractFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [samData, setSamData] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  async function handleFetchDetails() {
    const input = document.getElementById('sam_url') as HTMLInputElement;
    const value = input?.value?.trim();
    if (!value) return;
    setFetchError(null);
    setFetching(true);
    try {
      const result = await fetchSamDataAction(value);
      if (!result.ok) {
        setFetchError(result.error ?? 'Failed to fetch');
        return;
      }
      const d = result.data as Record<string, unknown>;
      setSamData(d);

      const titleEl = document.getElementById('title') as HTMLInputElement;
      const agencyEl = document.getElementById('agency') as HTMLInputElement;
      const dueEl = document.getElementById('due_date') as HTMLInputElement;
      const solEl = document.getElementById('solicitation_number') as HTMLInputElement;

      const title = d.title ?? d.Title;
      const agency = d.fullParentPathName ?? d.department ?? d.subTier ?? d.organizationName;
      const deadline = d.responseDeadLine ?? d.reponseDeadLine;
      const solNum = d.solicitationNumber ?? d.solicitation_number;

      if (titleEl && title) titleEl.value = String(title).trim();
      if (agencyEl && agency) agencyEl.value = String(agency).trim();
      if (deadline) {
        const rd = String(deadline).split('T')[0] || String(deadline).slice(0, 10);
        if (dueEl) dueEl.value = rd;
      }
      if (solEl && solNum) solEl.value = String(solNum).trim();
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const agency = formData.get('agency') as string;
    const due_date = formData.get('due_date') as string;
    const samInput = (formData.get('sam_url') as string)?.trim() || null;
    const { noticeId: sam_notice_id, url: sam_url } = samInput
      ? parseSamUrlOrId(samInput)
      : { noticeId: null, url: '' };
    const solicitation_number = (formData.get('solicitation_number') as string)?.trim() || null;
    // FormData doesn't include submit button with preventDefault - use submitter
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | undefined;
    const submitType = submitter?.value ?? (formData.get('submit_type') as string);
    const notes = (formData.get('notes') as string)?.trim() || null;

    if (!title || !agency || !due_date) return;

    const payload = {
      title,
      agency,
      due_date,
      sam_notice_id: sam_notice_id || null,
      solicitation_number,
      sam_url: sam_url || null,
      create_thread: submitType === 'create_and_thread',
      notes,
    };

    setSubmitError(null);
    startTransition(async () => {
      try {
        const contract = await action(payload);
        router.push(`/contracts/${contract.id}`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 space-y-4"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400">SAM.gov</h3>
        <div>
          <label htmlFor="sam_url" className="block text-sm font-medium text-slate-300 mb-1">
            SAM.gov URL <span className="text-slate-500">(paste link, then fetch details)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="sam_url"
              name="sam_url"
              type="text"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://sam.gov/workspace/contract/opp/..."
            />
            <button
              type="button"
              onClick={handleFetchDetails}
              disabled={fetching}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-slate-200 text-sm rounded-lg font-medium whitespace-nowrap"
            >
              {fetching ? 'Fetching…' : 'Fetch details'}
            </button>
          </div>
          {fetchError && <p className="text-rose-400 text-sm mt-1">{fetchError}</p>}
        </div>
        <div>
          <label htmlFor="solicitation_number" className="block text-sm font-medium text-slate-300 mb-1">
            Solicitation Number <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id="solicitation_number"
            name="solicitation_number"
            type="text"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. W52P1J-25-R-0001"
          />
        </div>
      </div>

      <hr className="border-slate-700" />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400">Contract</h3>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Contract title"
          />
        </div>
        <div>
          <label htmlFor="agency" className="block text-sm font-medium text-slate-300 mb-1">
            Agency
          </label>
          <input
            id="agency"
            name="agency"
            type="text"
            required
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Agency name"
          />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-slate-300 mb-1">
            Due Date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <hr className="border-slate-700" />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400">Slack thread (optional)</h3>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Notes <span className="text-slate-500">(included when creating a thread)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Add notes to include in the initial Slack post..."
          />
        </div>
      </div>

      {submitError && (
        <p className="text-rose-400 text-sm">{submitError}</p>
      )}

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          name="submit_type"
          value="create"
          disabled={isPending}
          className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Creating...' : 'Create'}
        </button>
        <button
          type="submit"
          name="submit_type"
          value="create_and_thread"
          disabled={isPending}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Creating...' : 'Create and start thread'}
        </button>
      </div>
    </form>
  );
}
