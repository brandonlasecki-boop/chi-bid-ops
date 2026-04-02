import type { Document, Form, FormStatus } from '@/types';

const FORM_STATUSES: FormStatus[] = [
  'not_started',
  'in_progress',
  'in_review',
  'blocked',
  'complete',
];

function normalizeFormStatus(s: string): FormStatus {
  return FORM_STATUSES.includes(s as FormStatus) ? (s as FormStatus) : 'not_started';
}

/** Safe props for Client Components — only strings/numbers (no DB driver oddities). */
export function mapFormForClient(f: Form): Form {
  return {
    id: String(f.id),
    contract_id: String(f.contract_id),
    name: String(f.name),
    description: f.description == null ? null : String(f.description),
    notes: f.notes == null ? null : String(f.notes),
    assigned_to: f.assigned_to == null ? null : String(f.assigned_to),
    status: normalizeFormStatus(String(f.status)),
    due_date: f.due_date == null ? null : String(f.due_date),
    weight: Number(f.weight) || 0,
    created_at: String(f.created_at),
    completed_at: f.completed_at == null ? null : String(f.completed_at),
    slack_requested_at: f.slack_requested_at == null ? null : String(f.slack_requested_at),
  };
}

export function mapDocumentForClient(d: Document): Document {
  const src = d.source;
  const source: 'upload' | 'complete' | null =
    src === 'upload' || src === 'complete' ? src : null;
  return {
    id: String(d.id),
    form_id: String(d.form_id),
    file_url: String(d.file_url),
    file_name: String(d.file_name),
    source,
    created_at: String(d.created_at),
  };
}

export function mapDocumentsByFormForClient(
  raw: Record<string, Document[]> | undefined
): Record<string, Document[]> {
  const out: Record<string, Document[]> = {};
  if (!raw) return out;
  for (const [formId, docs] of Object.entries(raw)) {
    out[String(formId)] = docs.map(mapDocumentForClient);
  }
  return out;
}

/**
 * Deep clone for nested JSON (e.g. SAM payload). Handles BigInt.
 */
export function toClientJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, v) => {
      if (typeof v === 'bigint') return v.toString();
      return v;
    })
  ) as T;
}
