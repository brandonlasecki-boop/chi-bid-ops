'use server';

import { revalidatePath } from 'next/cache';
import { getAssignees, createAssignee } from '@/lib/db/assignees';

export async function fetchAssigneesAction() {
  return getAssignees();
}

export async function createAssigneeAction(input: { name: string; email: string }) {
  const assignee = await createAssignee(input);
  revalidatePath('/', 'layout');
  return assignee;
}
