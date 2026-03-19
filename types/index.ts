export type ContractStatus =
  | 'intake'
  | 'in_progress'
  | 'review'
  | 'ready'
  | 'submitted';

export type FormStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'complete';

export interface Contract {
  id: string;
  display_id: string | null;
  title: string;
  agency: string;
  due_date: string;
  status: ContractStatus;
  progress: number;
  slack_thread_ts: string | null;
  sam_notice_id: string | null;
  solicitation_number: string | null;
  sam_url: string | null;
  sam_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Form {
  id: string;
  contract_id: string;
  name: string;
  description: string | null;
  notes: string | null;
  assigned_to: string | null;
  status: FormStatus;
  due_date: string | null;
  weight: number;
  created_at: string;
  completed_at: string | null;
  slack_requested_at: string | null;
}

export interface Document {
  id: string;
  form_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface ContractWithForms extends Contract {
  forms: Form[];
}

export const FORM_STATUS_PERCENT: Record<FormStatus, number> = {
  not_started: 0,
  in_progress: 50,
  in_review: 80,
  blocked: 0,
  complete: 100,
};
