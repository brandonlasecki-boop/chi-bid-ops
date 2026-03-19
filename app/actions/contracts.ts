'use server';

import { revalidatePath } from 'next/cache';
import { getContracts, getContractWithForms, createContract, deleteContract } from '@/lib/db/contracts';
import { updateForm, updateFormStatus, updateFormAssignment, updateFormNotes } from '@/lib/db/forms';
import {
  notifySlackContractCreated,
  notifySlackFormCompleted,
  requestFormInSlack,
} from '@/lib/slack';
import type { ContractStatus, FormStatus } from '@/types';

export async function fetchContracts() {
  return getContracts();
}

export async function fetchContractWithForms(id: string) {
  return getContractWithForms(id);
}

export async function deleteContractAction(id: string) {
  await deleteContract(id);
  revalidatePath('/');
  revalidatePath(`/contracts/${id}`);
}

export async function createContractAction(input: {
  title: string;
  agency: string;
  due_date: string;
  status?: ContractStatus;
  sam_notice_id?: string | null;
  solicitation_number?: string | null;
  sam_url?: string | null;
  sam_data?: Record<string, unknown> | null;
  create_thread?: boolean;
  notes?: string | null;
}) {
  const { create_thread, notes, ...contractInput } = input;
  const contract = await createContract(contractInput);

  if (create_thread) {
    const slackResult = await notifySlackContractCreated(contract, notes).catch((err) => {
      throw new Error(
        err instanceof Error ? err.message : 'Slack thread could not be created. Check SLACK_BOT_TOKEN and SLACK_CONTRACT_CHANNEL_ID, and that the bot is in the channel.'
      );
    });
    if (!slackResult?.threadTs) {
      throw new Error(
        'Slack thread could not be created. Check that SLACK_BOT_TOKEN and SLACK_CONTRACT_CHANNEL_ID are set in .env.local, and that the bot is invited to the channel.'
      );
    }
    const { updateContract } = await import('@/lib/db/contracts');
    await updateContract(contract.id, { slack_thread_ts: slackResult.threadTs });
  }

  revalidatePath('/');
  revalidatePath(`/contracts/${contract.id}`);
  return contract;
}

export async function updateFormStatusAction(formId: string, status: FormStatus) {
  const form = await updateFormStatus(formId, status);
  await notifySlackFormCompleted(form).catch(() => {});
  revalidatePath('/');
  revalidatePath(`/contracts/${form.contract_id}`);
  return form;
}

export async function updateFormAssignmentAction(formId: string, assignedTo: string | null) {
  const form = await updateFormAssignment(formId, assignedTo);
  revalidatePath('/');
  revalidatePath(`/contracts/${form.contract_id}`);
  return form;
}

export async function updateFormNotesAction(formId: string, notes: string | null) {
  const form = await updateFormNotes(formId, notes?.trim() || null);
  revalidatePath('/');
  revalidatePath(`/contracts/${form.contract_id}`);
  return form;
}

export async function updateFormAction(
  formId: string,
  updates: { status?: FormStatus; assigned_to?: string | null }
) {
  const form = await updateForm(formId, updates);
  if (updates.status) await notifySlackFormCompleted(form).catch(() => {});
  revalidatePath('/');
  revalidatePath(`/contracts/${form.contract_id}`);
  return form;
}

export async function requestFormInSlackAction(formId: string) {
  const form = await import('@/lib/db/forms').then((m) => m.getFormById(formId));
  const result = await requestFormInSlack(formId);
  if (!result.ok) throw new Error(result.error ?? 'Failed to send request to Slack');
  revalidatePath(`/contracts/${form.contract_id}`);
  return { ok: true };
}
