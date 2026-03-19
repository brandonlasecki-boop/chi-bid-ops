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

/** Only upload docs (excludes source='complete' from Slack) - for Upload modal */
export async function getUploadDocumentsByFormId(formId: string) {
  const docs = await getDocumentsByFormId(formId);
  return docs.filter((d) => d.source !== 'complete');
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

/** Documents with source='complete' - for Completed section (Slack submissions). Includes null for legacy. */
export async function getCompletedDocumentsByFormIds(formIds: string[]): Promise<Record<string, Document[]>> {
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
    if (doc.source === 'upload') continue;
    if (!byForm[doc.form_id]) byForm[doc.form_id] = [];
    byForm[doc.form_id].push(doc);
  }
  return byForm;
}

export async function createDocument(input: {
  form_id: string;
  file_url: string;
  file_name: string;
  source?: 'upload' | 'complete';
}) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({ ...input, source: input.source ?? 'upload' })
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
