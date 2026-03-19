import { WebClient } from '@slack/web-api';
import type { Contract, Form } from '@/types';

let client: WebClient | null = null;

function getSlackClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  if (!client) client = new WebClient(token);
  return client;
}

/** Resolve email to Slack @ mention. Returns <@USER_ID> or the email if lookup fails.
 * Requires Slack app scope: users:read.email (add in api.slack.com → Your App → OAuth & Permissions → Bot Token Scopes) */
async function getSlackMentionForEmail(slack: WebClient, email: string | null): Promise<string> {
  if (!email?.trim()) return '_Unassigned_';
  const trimmed = email.trim();
  for (const e of [trimmed, trimmed.toLowerCase()]) {
    try {
      const res = await slack.users.lookupByEmail({ email: e });
      if (res.ok && res.user?.id) return `<@${res.user.id}>`;
    } catch (err) {
      if (e === trimmed.toLowerCase() && process.env.NODE_ENV === 'development') {
        console.warn(
          `[Slack] Could not resolve email to @mention. Add users:read.email scope at api.slack.com → OAuth & Permissions:`,
          (err as Error)?.message ?? err
        );
      }
    }
  }
  return email;
}

export async function notifySlackContractCreated(
  contract: Contract,
  notes?: string | null
): Promise<{ threadTs: string } | null> {
  const slack = getSlackClient();
  const channelId = process.env.SLACK_CONTRACT_CHANNEL_ID;
  if (!slack || !channelId) return null;

  const lines = [
    `*New Contract Created*`,
    `*${contract.title}*`,
    `Agency: ${contract.agency}`,
    `Due: ${new Date(contract.due_date).toLocaleDateString()}`,
    `Contract ID: \`${contract.display_id ?? contract.id}\``,
  ];
  if (notes?.trim()) {
    lines.push('', `*Notes:*\n${notes.trim()}`);
  }

  const res = await slack.chat.postMessage({
    channel: channelId,
    text: `📋 New contract: *${contract.title}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: lines.join('\n'),
        },
      },
    ],
  });

  const threadTs = res.ts ?? null;
  return threadTs ? { threadTs } : null;
}

export async function postToContractThread(
  contractId: string,
  threadTs: string,
  text: string
): Promise<boolean> {
  const slack = getSlackClient();
  const channelId = process.env.SLACK_CONTRACT_CHANNEL_ID;
  if (!slack || !channelId) return false;

  await slack.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text,
  });
  return true;
}

export async function notifySlackFormAssigned(form: Form): Promise<boolean> {
  const slack = getSlackClient();
  if (!slack || !form.assigned_to) return false;

  const { getContractById } = await import('@/lib/db/contracts');
  const contract = await getContractById(form.contract_id).catch(() => null);
  if (!contract) return false;

  const assigneeMention = await getSlackMentionForEmail(slack, form.assigned_to);

  // DM to user (look up by email to get user ID for DM channel)
  try {
    const lookup = await slack.users.lookupByEmail({ email: form.assigned_to.trim() });
    if (lookup.ok && lookup.user?.id) {
      await slack.chat.postMessage({
        channel: lookup.user.id,
        text: `You've been assigned to *${form.name}* for contract *${contract.title}*`,
      });
    }
  } catch {
    // User not in Slack or DM failed
  }

  if (contract.slack_thread_ts) {
    let msg = `📌 *${form.name}* assigned to ${assigneeMention}`;
    if (form.notes?.trim()) msg += `\n_Notes:_ ${form.notes.trim()}`;
    await postToContractThread(contract.id, contract.slack_thread_ts, msg);
  }
  return true;
}

export async function notifySlackFormCompleted(form: Form): Promise<boolean> {
  if (form.status !== 'complete') return false;

  const { getContractById } = await import('@/lib/db/contracts');
  const contract = await getContractById(form.contract_id).catch(() => null);
  if (!contract || !contract.slack_thread_ts) return false;

  let msg = `✅ *${form.name}* completed`;
  if (form.notes?.trim()) msg += `\n_Notes:_ ${form.notes.trim()}`;
  return postToContractThread(contract.id, contract.slack_thread_ts, msg);
}

export async function getContractSummaryForSlack(contractId: string): Promise<string | null> {
  const slack = getSlackClient();
  const { getContractWithForms } = await import('@/lib/db/contracts');
  const data = await getContractWithForms(contractId).catch(() => null);
  if (!data) return null;

  const formLines = await Promise.all(
    data.forms.map(
      async (f: { name: string; status: string; assigned_to: string | null; notes?: string | null }) => {
        const assignee =
          slack && f.assigned_to
            ? await getSlackMentionForEmail(slack, f.assigned_to)
            : f.assigned_to ?? 'Unassigned';
        let line = `• ${f.name} | ${f.status} | Assigned: ${assignee}`;
        if (f.notes?.trim()) line += `\n  _Notes:_ ${f.notes.trim()}`;
        return line;
      }
    )
  );

  const lines = [
    `*${data.title}*`,
    `Contract ID: ${(data as { display_id?: string | null }).display_id ?? data.id}`,
    `Agency: ${data.agency}`,
    `Due: ${new Date(data.due_date).toLocaleDateString()}`,
    `Status: ${data.status}`,
    `Progress: ${data.progress}%`,
    '',
    '*Forms:*',
    ...formLines,
  ];
  return lines.join('\n');
}

export async function requestFormInSlack(formId: string): Promise<{ ok: boolean; error?: string }> {
  const slack = getSlackClient();
  const channelId = process.env.SLACK_CONTRACT_CHANNEL_ID;
  if (!slack || !channelId) {
    return { ok: false, error: 'Slack is not configured (SLACK_BOT_TOKEN or SLACK_CONTRACT_CHANNEL_ID)' };
  }

  const { getFormById, updateFormSlackRequested } = await import('@/lib/db/forms');
  const { getContractById } = await import('@/lib/db/contracts');
  const { getDocumentsByFormId } = await import('@/lib/db/documents');
  const { updateContract } = await import('@/lib/db/contracts');

  const form = await getFormById(formId).catch(() => null);
  if (!form) return { ok: false, error: 'Form not found' };

  const contract = await getContractById(form.contract_id).catch(() => null);
  if (!contract) return { ok: false, error: 'Contract not found' };

  const docs = await getDocumentsByFormId(formId);
  const docLinks = docs.length
    ? docs.map((d) => `<${d.file_url}|${d.file_name}>`).join(', ')
    : '_No files yet_';
  const assignee = await getSlackMentionForEmail(slack, form.assigned_to);

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${form.contract_id}`
    : null;

  const msgLines = [
    `📋 *Form requested: ${form.name}*`,
    `Contract: ${contract.title} (${(contract as { display_id?: string | null }).display_id ?? contract.id}) | Due: ${new Date(contract.due_date).toLocaleDateString()}`,
    `Status: ${form.status} | Assigned: ${assignee}`,
    `Files: ${docLinks}`,
  ];
  if (form.notes?.trim()) msgLines.push(`_Notes:_ ${form.notes.trim()}`);

  const blocks: Array<{ type: string; text?: { type: string; text: string } }> = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: msgLines.join('\n'),
      },
    },
  ];

  if (dashboardUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${dashboardUrl}|Open in Dashboard →>`,
      },
    });
  }

  let threadTs = contract.slack_thread_ts;

  if (!threadTs) {
    const res = await slack.chat.postMessage({
      channel: channelId,
      text: `📋 Form requested: ${form.name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Contract:* ${contract.title}\nA thread was created for form requests. Use the dashboard to manage forms.`,
          },
        },
      ],
    });
    threadTs = res.ts ?? null;
    if (threadTs) {
      await updateContract(form.contract_id, { slack_thread_ts: threadTs });
    }
  }

  if (threadTs) {
    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: `Form requested: ${form.name}`,
      blocks,
    });
    await updateFormSlackRequested(formId);
  }

  return { ok: true };
}

/** Parse a Slack thread message and mark matching forms as complete. Called from Events API. */
export async function processSlackMessageForFormCompletion(
  threadTs: string,
  text: string
): Promise<void> {
  const { getContractBySlackThreadTs } = await import('@/lib/db/contracts');
  const { getFormsByContractId } = await import('@/lib/db/forms');
  const { updateFormStatus } = await import('@/lib/db/forms');
  const { recalculateAndPersistProgress } = await import('@/lib/business/progress');

  const contract = await getContractBySlackThreadTs(threadTs);
  if (!contract) return;

  const forms = await getFormsByContractId(contract.id);
  const msg = text.toLowerCase();
  const completionKeywords = ['complete', 'completed', 'done', 'finished'];

  const hasCompletionKeyword =
    completionKeywords.some((k) => msg.includes(k)) || text.includes('✅');

  if (!hasCompletionKeyword) return;

  for (const form of forms) {
    if (form.status === 'complete') continue;
    const formNameLower = form.name.toLowerCase();
    if (msg.includes(formNameLower)) {
      await updateFormStatus(form.id, 'complete');
      await recalculateAndPersistProgress(contract.id);
    }
  }
}
