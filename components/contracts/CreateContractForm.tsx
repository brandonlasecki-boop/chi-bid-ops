'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSamDataAction } from '@/app/actions/sam';

export interface ProjectAssigneeOption {
  id: string;
  name: string;
  email: string;
}

interface CreateContractFormProps {
  assignees?: ProjectAssigneeOption[];
  action: (input: {
    title: string;
    agency: string;
    due_date: string;
    sam_notice_id?: string | null;
    solicitation_number?: string | null;
    sam_url?: string | null;
    sam_data?: Record<string, unknown> | null;
    create_thread?: boolean;
    create_project?: boolean;
    notes?: string | null;
    invite_assignee_ids?: string[];
    opportunity_number?: number | null;
    naics?: string | null;
    opportunity_type?: string | null;
    service_area?: string | null;
    prospect_contractors?: string | null;
    key_personnel?: string | null;
    equipment_notes?: string | null;
  }) => Promise<{ id: string }>;
}

function parseSamUrlOrId(input: string): { noticeId: string | null; url: string } {
  const trimmed = input?.trim() || '';
  if (!trimmed) return { noticeId: null, url: '' };

  const match = trimmed.match(/\/opp\/([a-f0-9-]{20,})/i);
  if (match) {
    const noticeId = match[1];
    return {
      noticeId,
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    };
  }

  if (/^[a-f0-9-]{20,}$/i.test(trimmed)) {
    return {
      noticeId: trimmed,
      url: `https://sam.gov/opp/${trimmed}/view`,
    };
  }

  return { noticeId: null, url: trimmed.startsWith('http') ? trimmed : '' };
}

export function CreateContractForm({ action, assignees = [] }: CreateContractFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [samData, setSamData] = useState<Record<string, unknown> | null>(null);
  const [inviteIds, setInviteIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  function toggleInvite(id: string) {
    setInviteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | undefined;
    const submitType = submitter?.value ?? (formData.get('submit_type') as string);
    const notes = (formData.get('notes') as string)?.trim() || null;

    const oppRaw = (formData.get('opportunity_number') as string)?.trim();
    const opportunity_number = oppRaw ? parseInt(oppRaw, 10) : null;

    if (!title || !agency || !due_date) return;

    const payload = {
      title,
      agency,
      due_date,
      sam_notice_id: sam_notice_id || null,
      solicitation_number,
      sam_url: sam_url || null,
      sam_data: samData,
      create_thread: submitType === 'create_and_thread',
      create_project: submitType === 'create_project',
      notes,
      invite_assignee_ids: submitType === 'create_project' ? Array.from(inviteIds) : undefined,
      opportunity_number: Number.isFinite(opportunity_number as number) ? opportunity_number : null,
      naics: (formData.get('naics') as string)?.trim() || null,
      opportunity_type: (formData.get('opportunity_type') as string)?.trim() || null,
      service_area: (formData.get('service_area') as string)?.trim() || null,
      prospect_contractors: (formData.get('prospect_contractors') as string)?.trim() || null,
      key_personnel: (formData.get('key_personnel') as string)?.trim() || null,
      equipment_notes: (formData.get('equipment_notes') as string)?.trim() || null,
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
      className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 space-y-6"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400">SAM.gov</h3>
        <div>
          <label htmlFor="sam_url" className="block text-sm font-medium text-slate-300 mb-1">
            SAM.gov URL <span className="text-slate-500">(optional — paste link, then fetch details)</span>
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
        <h3 className="text-sm font-medium text-slate-400">Opportunity details (for Slack first post)</h3>
        <p className="text-xs text-slate-500">
          Used when you create a Slack project channel. All optional except what you need in the announcement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="opportunity_number" className="block text-sm font-medium text-slate-300 mb-1">
              Opportunity #
            </label>
            <input
              id="opportunity_number"
              name="opportunity_number"
              type="number"
              min={1}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label htmlFor="naics" className="block text-sm font-medium text-slate-300 mb-1">
              NAICS
            </label>
            <input
              id="naics"
              name="naics"
              type="text"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. 621399"
            />
          </div>
        </div>
        <div>
          <label htmlFor="opportunity_type" className="block text-sm font-medium text-slate-300 mb-1">
            Contract opportunity type
          </label>
          <input
            id="opportunity_type"
            name="opportunity_type"
            type="text"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Solicitation"
          />
        </div>
        <div>
          <label htmlFor="service_area" className="block text-sm font-medium text-slate-300 mb-1">
            Service area
          </label>
          <textarea
            id="service_area"
            name="service_area"
            rows={2}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[60px]"
            placeholder="Location / coverage"
          />
        </div>
        <div>
          <label htmlFor="prospect_contractors" className="block text-sm font-medium text-slate-300 mb-1">
            Prospect contractor
          </label>
          <input
            id="prospect_contractors"
            name="prospect_contractors"
            type="text"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. CHI (Primary) and AZ Med (subcontractor)"
          />
        </div>
        <div>
          <label htmlFor="key_personnel" className="block text-sm font-medium text-slate-300 mb-1">
            Key personnel
          </label>
          <textarea
            id="key_personnel"
            name="key_personnel"
            rows={4}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[80px]"
            placeholder="Staffing summary, roles…"
          />
        </div>
        <div>
          <label htmlFor="equipment_notes" className="block text-sm font-medium text-slate-300 mb-1">
            Equipment / technology
          </label>
          <textarea
            id="equipment_notes"
            name="equipment_notes"
            rows={6}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[120px]"
            placeholder="Monitoring equipment, software, connectivity…"
          />
        </div>
      </div>

      <hr className="border-slate-700" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400">Slack project channel</h3>
        <p className="text-xs text-slate-500">
          Creates channel <code className="bg-slate-800 px-1 rounded">chi-contract-001</code>,{' '}
          <code className="bg-slate-800 px-1 rounded">chi-contract-002</code>, … and posts the opportunity. Select
          teammates to invite (must use workspace email in Assignees).
        </p>
        {assignees.length === 0 ? (
          <p className="text-sm text-amber-200/80">
            No assignees yet. Add people under a contract’s <strong>+ Add Assignee</strong> first, or create the
            project without invites and add people in Slack.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {assignees.map((a) => (
              <label key={a.id} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={inviteIds.has(a.id)}
                  onChange={() => toggleInvite(a.id)}
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500"
                />
                <span>{a.name}</span>
                <span className="text-slate-500 text-xs">({a.email})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <hr className="border-slate-700" />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400">Legacy Slack (optional)</h3>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Notes <span className="text-slate-500">(only for “thread in shared channel”)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Extra text for the old single-channel thread…"
          />
        </div>
      </div>

      {submitError && <p className="text-rose-400 text-sm">{submitError}</p>}

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          name="submit_type"
          value="create"
          disabled={isPending}
          className="flex-1 py-2.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Creating...' : 'Create only'}
        </button>
        <button
          type="submit"
          name="submit_type"
          value="create_project"
          disabled={isPending}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Creating...' : 'Create project + Slack channel'}
        </button>
        <button
          type="submit"
          name="submit_type"
          value="create_and_thread"
          disabled={isPending}
          className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition-colors text-sm"
        >
          {isPending ? 'Creating...' : 'Create + thread (shared channel)'}
        </button>
      </div>
    </form>
  );
}
