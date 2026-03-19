import { createServerClient } from '@/lib/supabase/server';
import type { Document } from '@/types';

export async function getDocumentById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Document;
}

export async function getDocumentsByFormId(formId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Document[];
}

export async function getDocumentsByFormIds(formIds: string[]): Promise<Record<string, Document[]>> {
  if (formIds.length === 0) return {};
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .in('form_id', formIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const byForm: Record<string, Document[]> = {};
  for (const fid of formIds) byForm[fid] = [];
  for (const doc of (data ?? []) as Document[]) {
    if (!byForm[doc.form_id]) byForm[doc.form_id] = [];
    byForm[doc.form_id].push(doc);
  }
  return byForm;
}

export async function createDocument(input: {
  form_id: string;
  file_url: string;
  file_name: string;
}) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}
