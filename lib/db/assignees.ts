import { createServerClient } from '@/lib/supabase/server';

export interface Assignee {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export async function getAssignees() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('assignees')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Assignee[];
}

export async function createAssignee(input: { name: string; email: string }) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('assignees')
    .insert({ name: input.name.trim(), email: input.email.trim().toLowerCase() })
    .select()
    .single();

  if (error) throw error;
  return data as Assignee;
}
