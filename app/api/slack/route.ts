import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const signingSecret = process.env.SLACK_SIGNING_SECRET;
const token = process.env.SLACK_BOT_TOKEN;

function verifySlackSignature(body: string, signature: string): boolean {
  if (!signingSecret || !signature) return false;
  try {
    const sigBasestring = `v0:${body}`;
    const mySig =
      'v0=' +
      crypto.createHmac('sha256', signingSecret).update(sigBasestring).digest('hex');
    const a = Buffer.from(mySig, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: 'Empty body' }, { status: 400 });
  }

  // Handle URL verification FIRST - Slack requires challenge response before anything else
  if (body && body.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(body) as { type?: string; challenge?: string };
      if (parsed.type === 'url_verification' && typeof parsed.challenge === 'string') {
        return new NextResponse(parsed.challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    } catch {
      // Not valid JSON or not url_verification, continue
    }
  }

  if (!signingSecret || !token) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 503 });
  }

  const signature = req.headers.get('x-slack-signature') ?? '';
  if (!verifySlackSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';

  // Events API sends JSON
  if (contentType.includes('application/json')) {
    const payload = JSON.parse(body) as {
      type?: string;
      challenge?: string;
      event?: {
        type?: string;
        text?: string;
        thread_ts?: string;
        subtype?: string;
        bot_id?: string;
      };
    };

    // Message event - check for form completion in thread replies
    if (payload.type === 'event_callback' && payload.event?.type === 'message') {
      const ev = payload.event;
      // Skip bot messages, edits, deletes, and non-thread messages
      if (ev.bot_id || ev.subtype) return NextResponse.json({ ok: true });
      if (ev.thread_ts && ev.text?.trim()) {
        // Process async - respond 200 immediately (Slack requires <3s)
        const { processSlackMessageForFormCompletion } = await import('@/lib/slack');
        processSlackMessageForFormCompletion(ev.thread_ts, ev.text).catch((err) =>
          console.error('[Slack] Form completion processing error:', err)
        );
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Slash commands send form-urlencoded
  const params = Object.fromEntries(new URLSearchParams(body));

  if (params.command === '/contract-status') {
    const contractId = (params.text ?? '').trim().split(/\s+/)[0];

    if (!contractId) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Usage: `/contract-status <contract-id>`',
      });
    }

    const { getContractSummaryForSlack } = await import('@/lib/slack');
    const summary = await getContractSummaryForSlack(contractId);

    if (!summary) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `Contract not found: ${contractId}`,
      });
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: summary,
    });
  }

  return NextResponse.json({ ok: true });
}
