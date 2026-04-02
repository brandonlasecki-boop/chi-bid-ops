import { WebClient } from '@slack/web-api';
import type { Contract, Form } from '@/types';

let client: WebClient | null = null;

function getSlackClient(): WebClient | null {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  if (!client) client = new WebClient(token);
  return client;
}

/** Slack channel name: chi-contract-001 (lowercase, hyphens; Slack rules) */
export function formatSlackProjectChannelName(seq: number): string {
  return `chi-contract-${String(seq).padStart(3, '0')}`;
}

/** First post body for a new project channel (mrkdwn). */
export function buildOpportunitySlackMessage(contract: Contract): string {
  const blocks: string[] = [];
  const oppNum = contract.opportunity_number;
  if (oppNum != null) blocks.push(`*OPPORTUNITY # ${oppNum}:*`);
  if (contract.sam_notice_id) blocks.push(`*Notice ID:* ${contract.sam_notice_id}`);
  if (contract.opportunity_type?.trim()) {
    blocks.push(`*Contract Opportunity Type:* ${contract.opportunity_type.trim()}`);
  }
  if (contract.naics?.trim()) blocks.push(`*NAICS:* ${contract.naics.trim()}`);
  blocks.push(`*Title:* ${contract.title}`);
  blocks.push(`*Agency:* ${contract.agency}`);
  const due = new Date(contract.due_date);
  blocks.push(
    `*Due:* ${due.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })} CDT`
  );
  if (contract.service_area?.trim()) blocks.push(`*Service Area:* ${contract.service_area.trim()}`);
  if (contract.prospect_contractors?.trim()) {
    blocks.push(`*Prospect Contractor:* ${contract.prospect_contractors.trim()}`);
  }
  if (contract.sam_url?.trim()) blocks.push(`*Link:* ${contract.sam_url.trim()}`);
  if (contract.key_personnel?.trim()) {
    blocks.push('', '*Key Personnel:*', '', contract.key_personnel.trim());
  }
  if (contract.equipment_notes?.trim()) {
    blocks.push(
      '',
      '*Possible Equipment Medically Required/Necessary for the type of service:*',
      '',
      contract.equipment_notes.trim()
    );
  }
  const body = blocks.join('\n').trim();
  return body || `*${contract.title}*\n*Agency:* ${contract.agency}`;
}

export type CreateSlackProjectResult = {
  channelId: string;
  threadTs: string;
};

/**
 * Create Slack channel Chi_Contract###, invite users, post opportunity message.
 * Scopes: channels:manage (public) or groups:write (private), channels:join, users:read.email
 */
export async function createSlackProjectChannel(
  contract: Contract,
  seq: number,
  inviteEmails: string[]
): Promise<CreateSlackProjectResult> {
  const slack = getSlackClient();
  if (!slack) throw new Error('SLACK_BOT_TOKEN is not set');

  const name = formatSlackProjectChannelName(seq);
  const isPrivate = process.env.SLACK_PROJECT_CHANNEL_PRIVATE === 'true';

  const createRes = await slack.conversations.create({
    name,
    is_private: isPrivate,
  });

  if (!createRes.ok || !createRes.channel?.id) {
    throw new Error(
      `Slack could not create channel "${name}": ${createRes.error ?? 'unknown'}. Add channels:manage (public) or groups:write (private) and reinstall the app.`
    );
  }

  const channelId = createRes.channel.id;

  const uniqueEmails = Array.from(
    new Set(inviteEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );
  const userIds: string[] = [];
  for (const email of uniqueEmails) {
    try {
      const lu = await slack.users.lookupByEmail({ email });
      if (lu.ok && lu.user?.id) userIds.push(lu.user.id);
    } catch {
      // skip missing users
    }
  }

  if (userIds.length > 0) {
    await slack.conversations.invite({
      channel: channelId,
      users: userIds.join(','),
    }).catch((err) => {
      console.warn('[Slack] conversations.invite:', err);
    });
  }

  const text = buildOpportunitySlackMessage(contract);
  const post = await slack.chat.postMessage({
    channel: channelId,
    text: `📋 ${contract.title}`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text },
      },
    ],
  });

  const threadTs = post.ts;
  if (!threadTs) throw new Error('Slack did not return a message timestamp');

  return { channelId, threadTs };
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
  const channelId = contract.slack_channel_id ?? process.env.SLACK_CONTRACT_CHANNEL_ID;
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
  const { getContractById } = await import('@/lib/db/contracts');
  const contract = await getContractById(contractId).catch(() => null);
  const channelId = contract?.slack_channel_id ?? process.env.SLACK_CONTRACT_CHANNEL_ID;
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
  if (!slack) {
    return { ok: false, error: 'Slack is not configured (SLACK_BOT_TOKEN)' };
  }

  const { getFormById, updateFormSlackRequested } = await import('@/lib/db/forms');
  const { getContractById } = await import('@/lib/db/contracts');
  const { getDocumentsByFormId } = await import('@/lib/db/documents');
  const { updateContract } = await import('@/lib/db/contracts');

  const form = await getFormById(formId).catch(() => null);
  if (!form) return { ok: false, error: 'Form not found' };

  const contract = await getContractById(form.contract_id).catch(() => null);
  if (!contract) return { ok: false, error: 'Contract not found' };

  const channelId = contract.slack_channel_id ?? process.env.SLACK_CONTRACT_CHANNEL_ID;
  if (!channelId) {
    return {
      ok: false,
      error:
        'No Slack channel for this project. Create a project with Slack channel, or set SLACK_CONTRACT_CHANNEL_ID for legacy.',
    };
  }

  const docs = await getDocumentsByFormId(formId);
  const docLinks = docs.length
    ? docs.map((d) => `<${d.file_url}|${d.file_name}>`).join(', ')
    : '_No files yet_';
  const assignee = await getSlackMentionForEmail(slack, form.assigned_to);

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
            text: `*Contract:* ${contract.title}\nA thread was created for form requests. Reply in this thread with form name + "complete" to mark forms done.`,
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

interface SlackFile {
  id?: string;
  name?: string;
  url_private_download?: string;
  url_private?: string;
  mimetype?: string;
}

/** Download a file from Slack and upload to a form. Requires files:read scope. */
async function uploadSlackFileToForm(
  formId: string,
  file: SlackFile,
  botToken: string
): Promise<boolean> {
  let url = file.url_private_download ?? file.url_private;
  if (!url && file.id) {
    try {
      const { WebClient } = await import('@slack/web-api');
      const slack = new WebClient(botToken);
      const res = await slack.files.info({ file: file.id });
      const f = res.file as { url_private_download?: string; url_private?: string; name?: string; mimetype?: string };
      url = f?.url_private_download ?? f?.url_private;
      if (url && !file.name) (file as { name?: string }).name = f?.name;
      if (!file.mimetype && f?.mimetype) (file as { mimetype?: string }).mimetype = f?.mimetype;
    } catch (err) {
      console.error('[Slack] files.info error:', err);
      return false;
    }
  }
  if (!url) {
    console.error('[Slack] No download URL for file:', file.id, file.name);
    return false;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${botToken}` },
  });
  if (!res.ok) return false;

  const buffer = Buffer.from(await res.arrayBuffer());
  const fileName = file.name || `slack-file-${file.id || Date.now()}`;
  const ext = fileName.split('.').pop() || 'bin';

  const { createServerClient } = await import('@/lib/supabase/server');
  const { getFormById } = await import('@/lib/db/forms');
  const { createDocument } = await import('@/lib/db/documents');

  const form = await getFormById(formId).catch(() => null);
  if (!form) return false;

  const BUCKET = process.env.STORAGE_BUCKET ?? 'form-documents';
  const supabase = createServerClient();
  const path = `${form.contract_id}/${formId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Slack] Storage upload error:', uploadError);
    return false;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  await createDocument({
    form_id: formId,
    file_url: urlData.publicUrl,
    file_name: fileName,
    source: 'complete',
  });
  return true;
}

/** Parse a Slack thread message: mark matching forms complete and upload any attached files. */
export async function processSlackMessageForFormCompletion(
  threadTs: string,
  text: string,
  files?: SlackFile[],
  botToken?: string,
  slackChannelId?: string
): Promise<void> {
  const { getContractBySlackThreadTs, getContractBySlackChannelId } = await import('@/lib/db/contracts');
  const { getFormsByContractId } = await import('@/lib/db/forms');
  const { updateFormStatus } = await import('@/lib/db/forms');
  const { recalculateAndPersistProgress } = await import('@/lib/business/progress');

  let contract = slackChannelId ? await getContractBySlackChannelId(slackChannelId) : null;
  if (!contract) {
    contract = await getContractBySlackThreadTs(threadTs);
  }
  if (!contract) {
    console.log('[Slack] No contract found for channel:', slackChannelId, 'thread_ts:', threadTs);
    return;
  }

  const forms = await getFormsByContractId(contract.id);
  console.log('[Slack] Processing for contract:', contract.title, 'forms:', forms.map((f) => f.name).join(', '), 'text:', JSON.stringify(text?.slice(0, 100)));
  const msg = (text || '').toLowerCase();
  const completionKeywords = ['complete', 'completed', 'done', 'finished'];
  const hasCompletionKeyword =
    completionKeywords.some((k) => msg.includes(k)) || text.includes('✅');

  const matchedForms = forms.filter((f) => msg.includes(f.name.toLowerCase()));
  if (forms.length > 0 && matchedForms.length === 0) {
    console.log('[Slack] No form name matched in message. Form names:', forms.map((f) => f.name).join(', '));
  }

  for (const form of forms) {
    const formNameLower = form.name.toLowerCase();
    const matchesForm = msg.includes(formNameLower);

    if (matchesForm && hasCompletionKeyword && form.status !== 'complete') {
      console.log('[Slack] Marking form complete:', form.name);
      await updateFormStatus(form.id, 'complete');
      await recalculateAndPersistProgress(contract.id);
    }

    if (matchesForm && files?.length && botToken) {
      console.log('[Slack] Uploading', files.length, 'file(s) to form:', form.name);
      for (const file of files) {
        await uploadSlackFileToForm(form.id, file, botToken).catch((err) =>
          console.error('[Slack] File upload error:', err)
        );
      }
    }
  }
}
