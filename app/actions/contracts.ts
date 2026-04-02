'use server';

import { revalidatePath } from 'next/cache';
import {
  getContracts,
  getContractWithForms,
  createContract,
  deleteContract,
  getNextSlackProjectSeq,
  updateContract,
} from '@/lib/db/contracts';
import { getAssignees } from '@/lib/db/assignees';
import { updateForm, updateFormStatus, updateFormAssignment, updateFormNotes } from '@/lib/db/forms';
import {
  notifySlackContractCreated,
  notifySlackFormCompleted,
  requestFormInSlack,
  createSlackProjectChannel,
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
  create_project?: boolean;
  notes?: string | null;
  invite_assignee_ids?: string[];
  opportunity_number?: number | null;
  naics?: string | null;
  opportunity_type?: string | null;
  service_area?: string | null;
  prospect_contractors?: string | null;
  key_personnel?: string | null;
  equipment_notes?: string | null;
}) {
  const {
    create_thread,
    create_project,
    notes,
    invite_assignee_ids,
    opportunity_number,
    naics,
    opportunity_type,
    service_area,
    prospect_contractors,
    key_personnel,
    equipment_notes,
    ...contractInput
  } = input;

  let slackProjectSeq: number | undefined;
  if (create_project) {
    slackProjectSeq = await getNextSlackProjectSeq();
  }

  const contract = await createContract({
    ...contractInput,
    slack_project_seq: slackProjectSeq ?? null,
    opportunity_number: opportunity_number ?? null,
    naics: naics?.trim() || null,
    opportunity_type: opportunity_type?.trim() || null,
    service_area: service_area?.trim() || null,
    prospect_contractors: prospect_contractors?.trim() || null,
    key_personnel: key_personnel?.trim() || null,
    equipment_notes: equipment_notes?.trim() || null,
  });

  if (create_project && slackProjectSeq != null) {
    const allAssignees = await getAssignees();
    const idSet = new Set(invite_assignee_ids ?? []);
    const emails = allAssignees.filter((a) => idSet.has(a.id)).map((a) => a.email);
    const slackResult = await createSlackProjectChannel(contract, slackProjectSeq, emails).catch((err) => {
      throw new Error(
        err instanceof Error ? err.message : 'Slack project channel could not be created. Check bot token and scopes (channels:manage or groups:write, users:read.email).'
      );
    });
    await updateContract(contract.id, {
      slack_channel_id: slackResult.channelId,
      slack_thread_ts: slackResult.threadTs,
    });
  } else if (create_thread) {
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
