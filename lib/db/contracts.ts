import { createServerClient } from '@/lib/supabase/server';
import type { Contract, ContractStatus } from '@/types';

export async function getContracts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as Contract[];
}

export async function getContractById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Contract;
}

export async function getContractBySlackThreadTs(slackThreadTs: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('slack_thread_ts', slackThreadTs)
    .maybeSingle();

  if (error) throw error;
  return data as Contract | null;
}

export async function getContractBySlackChannelId(slackChannelId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('slack_channel_id', slackChannelId)
    .maybeSingle();

  if (error) throw error;
  return data as Contract | null;
}

export async function getNextSlackProjectSeq(): Promise<number> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('slack_project_seq')
    .not('slack_project_seq', 'is', null)
    .order('slack_project_seq', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const row = data as { slack_project_seq: number } | null;
  return (row?.slack_project_seq ?? 0) + 1;
}

export async function getContractWithForms(id: string) {
  const supabase = createServerClient();
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (contractError) throw contractError;
  if (!contract) return null;

  const { data: forms, error: formsError } = await supabase
    .from('forms')
    .select('*')
    .eq('contract_id', id)
    .order('created_at', { ascending: true });

  if (formsError) throw formsError;

  const formList = forms ?? [];
  const { getCompletedDocumentsByFormIds } = await import('@/lib/db/documents');
  const documentsByForm = await getCompletedDocumentsByFormIds(formList.map((f) => f.id));

  return {
    ...contract,
    forms: formList,
    documentsByForm,
  };
}

export async function createContract(input: {
  title: string;
  agency: string;
  due_date: string;
  status?: ContractStatus;
  slack_thread_ts?: string | null;
  slack_channel_id?: string | null;
  slack_project_seq?: number | null;
  opportunity_number?: number | null;
  naics?: string | null;
  opportunity_type?: string | null;
  service_area?: string | null;
  prospect_contractors?: string | null;
  key_personnel?: string | null;
  equipment_notes?: string | null;
  sam_notice_id?: string | null;
  solicitation_number?: string | null;
  sam_url?: string | null;
  sam_data?: Record<string, unknown> | null;
}) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      title: input.title,
      agency: input.agency,
      due_date: input.due_date,
      status: input.status ?? 'intake',
      slack_thread_ts: input.slack_thread_ts ?? null,
      slack_channel_id: input.slack_channel_id ?? null,
      slack_project_seq: input.slack_project_seq ?? null,
      opportunity_number: input.opportunity_number ?? null,
      naics: input.naics ?? null,
      opportunity_type: input.opportunity_type ?? null,
      service_area: input.service_area ?? null,
      prospect_contractors: input.prospect_contractors ?? null,
      key_personnel: input.key_personnel ?? null,
      equipment_notes: input.equipment_notes ?? null,
      sam_notice_id: input.sam_notice_id ?? null,
      solicitation_number: input.solicitation_number ?? null,
      sam_url: input.sam_url ?? null,
      sam_data: input.sam_data ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Contract;
}

export async function updateContract(
  id: string,
  updates: Partial<
    Pick<
      Contract,
      | 'title'
      | 'agency'
      | 'due_date'
      | 'status'
      | 'slack_thread_ts'
      | 'slack_channel_id'
      | 'slack_project_seq'
      | 'opportunity_number'
      | 'naics'
      | 'opportunity_type'
      | 'service_area'
      | 'prospect_contractors'
      | 'key_personnel'
      | 'equipment_notes'
      | 'sam_notice_id'
      | 'solicitation_number'
      | 'sam_url'
      | 'sam_data'
    >
  >
) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Contract;
}

export async function updateContractSlackThread(id: string, slack_thread_ts: string) {
  return updateContract(id, { slack_thread_ts });
}

export async function deleteContract(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
}
