import { createServerClient } from '@/lib/supabase/server';
import type { Form, FormStatus } from '@/types';

export async function getFormsByContractId(contractId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Form[];
}

export async function getFormById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Form;
}

export async function createForm(input: {
  contract_id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  weight?: number;
}) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .insert({
      contract_id: input.contract_id,
      name: input.name,
      description: input.description ?? null,
      notes: input.notes ?? null,
      assigned_to: input.assigned_to ?? null,
      status: 'not_started',
      due_date: input.due_date ?? null,
      weight: input.weight ?? 10,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}

export async function updateFormStatus(id: string, status: FormStatus) {
  const supabase = createServerClient();
  const updates: Partial<Form> = { status };
  if (status === 'complete') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}

export async function updateFormAssignment(id: string, assigned_to: string | null) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .update({ assigned_to })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}

export async function updateFormSlackRequested(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .update({ slack_requested_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}

export async function updateFormNotes(id: string, notes: string | null) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('forms')
    .update({ notes: notes?.trim() || null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}

export async function updateForm(
  id: string,
  updates: Partial<Pick<Form, 'name' | 'description' | 'notes' | 'assigned_to' | 'status' | 'due_date' | 'weight'>>
) {
  const supabase = createServerClient();
  const payload: Record<string, unknown> = { ...updates };
  if (updates.status === 'complete') {
    payload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('forms')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Form;
}
