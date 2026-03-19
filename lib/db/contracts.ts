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

export async function getContractWithForms(id: string) {
  const supabase = createServerClient();
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();

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
      sam_notice_id: input.sam_notice_id ?? null,
      solicitation_number: input.solicitation_number ?? null,
      sam_url: input.sam_url ?? null,
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
