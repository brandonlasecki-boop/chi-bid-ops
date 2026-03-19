'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateFormStatusAction,
  updateFormAssignmentAction,
  updateFormNotesAction,
  requestFormInSlackAction,
} from '@/app/actions/contracts';
import type { Document, Form, FormStatus } from '@/types';

export interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface FormsTableProps {
  forms: Form[];
  contractId: string;
  assignees: Assignee[];
  documentsByForm?: Record<string, Document[]>;
  onUploadClick: (form: Form) => void;
}

const FORM_STATUSES: FormStatus[] = [
  'not_started',
  'in_progress',
  'in_review',
  'blocked',
  'complete',
];

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

function formatDateTime(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FormsTable({ forms, contractId, assignees, documentsByForm = {}, onUploadClick }: FormsTableProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [slackSending, setSlackSending] = useState<string | null>(null);
  const [slackError, setSlackError] = useState<{ formId: string; message: string } | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  async function handleStatusChange(formId: string, status: FormStatus) {
    setUpdating(formId);
    try {
      await updateFormStatusAction(formId, status);
    } finally {
      setUpdating(null);
    }
  }

  async function handleAssignmentChange(formId: string, value: string | null) {
    setUpdating(formId);
    try {
      await updateFormAssignmentAction(formId, value?.trim() || null);
    } finally {
      setUpdating(null);
    }
  }

  async function handleNotesChange(formId: string, notes: string) {
    setUpdating(formId);
    try {
      await updateFormNotesAction(formId, notes.trim() || null);
      setEditingNotes((prev) => {
        const next = { ...prev };
        delete next[formId];
        return next;
      });
      router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  async function handleRequestInSlack(formId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSlackError(null);
    setSlackSending(formId);
    try {
      await requestFormInSlackAction(formId);
      router.refresh();
    } catch (err) {
      setSlackError({
        formId,
        message: err instanceof Error ? err.message : 'Failed to send to Slack',
      });
    } finally {
      setSlackSending(null);
    }
  }

  if (forms.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center">
        No forms yet. Add forms from the contract detail page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50">
            <th className="text-left py-3 px-4 font-medium text-slate-300">Name</th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">Assigned To</th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">Notes</th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">Due Date</th>
            <th className="text-left py-3 px-4 font-medium text-slate-300">Completed / Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr
              key={form.id}
              className={`border-b border-slate-700/50 transition-colors ${
                form.status === 'complete'
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25'
                  : 'hover:bg-slate-800/30'
              }`}
            >
              <td className="py-3 px-4">
                <span className="font-medium text-slate-100">{form.name}</span>
                {form.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>
                )}
              </td>
              <td className="py-3 px-4">
                <select
                  value={
                    form.assigned_to
                      ? assignees.find((a) => a.email.toLowerCase() === form.assigned_to?.toLowerCase())?.email ?? ''
                      : ''
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    handleAssignmentChange(form.id, v || null);
                  }}
                  disabled={!!updating}
                  className="w-44 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.email}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4">
                <select
                  value={form.status}
                  disabled={!!updating}
                  onChange={(e) =>
                    handleStatusChange(form.id, e.target.value as FormStatus)
                  }
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {FORM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4">
                <textarea
                  value={editingNotes[form.id] ?? form.notes ?? ''}
                  onChange={(e) =>
                    setEditingNotes((prev) => ({ ...prev, [form.id]: e.target.value }))
                  }
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (form.notes ?? '').trim()) handleNotesChange(form.id, val);
                  }}
                  disabled={!!updating}
                  placeholder="Add notes…"
                  rows={2}
                  className="w-full min-w-[140px] max-w-[200px] bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 resize-none"
                />
              </td>
              <td className="py-3 px-4 text-slate-400">{formatDate(form.due_date)}</td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap items-center gap-2">
                  {form.status === 'complete' && (documentsByForm[form.id]?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {documentsByForm[form.id].map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                        >
                          {doc.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                  {form.status !== 'complete' && (
                    <button
                      type="button"
                      onClick={() => onUploadClick(form)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                    >
                      Upload
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleRequestInSlack(form.id, e)}
                    disabled={!!slackSending}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded disabled:opacity-50"
                  >
                    {slackSending === form.id ? 'Sending…' : 'Request in Slack'}
                  </button>
                  {form.slack_requested_at && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs" title={formatDateTime(form.slack_requested_at)}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{formatDateTime(form.slack_requested_at)}</span>
                    </span>
                  )}
                </div>
                {slackError?.formId === form.id && (
                  <p className="text-rose-400 text-xs mt-1">{slackError.message}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
