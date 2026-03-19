'use server';

import { revalidatePath } from 'next/cache';
import { createForm } from '@/lib/db/forms';
import { notifySlackFormAssigned } from '@/lib/slack';

export async function createFormAction(input: {
  contract_id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  weight?: number;
}) {
  const form = await createForm(input);
  if (form.assigned_to) {
    await notifySlackFormAssigned(form).catch(() => {});
  }
  revalidatePath('/');
  revalidatePath(`/contracts/${input.contract_id}`);
  return form;
}
