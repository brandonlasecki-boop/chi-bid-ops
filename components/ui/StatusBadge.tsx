'use client';

import type { ContractStatus, FormStatus } from '@/types';

const CONTRACT_STYLES: Record<ContractStatus, string> = {
  intake: 'bg-slate-600 text-slate-200',
  in_progress: 'bg-amber-600/80 text-amber-100',
  review: 'bg-blue-600/80 text-blue-100',
  ready: 'bg-emerald-500/40 text-emerald-100',
  submitted: 'bg-emerald-500/40 text-emerald-100',
};

const FORM_STYLES: Record<FormStatus, string> = {
  not_started: 'bg-slate-600 text-slate-300',
  in_progress: 'bg-amber-600/80 text-amber-100',
  in_review: 'bg-blue-600/80 text-blue-100',
  blocked: 'bg-rose-600/80 text-rose-100',
  complete: 'bg-emerald-500/40 text-emerald-100',
};

function formatStatus(s: string): string {
  return s.replace(/_/g, ' ');
}

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

export function ContractStatusBadge({ status, className = '' }: ContractStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${CONTRACT_STYLES[status]} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

interface FormStatusBadgeProps {
  status: FormStatus;
  className?: string;
}

export function FormStatusBadge({ status, className = '' }: FormStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${FORM_STYLES[status]} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}
