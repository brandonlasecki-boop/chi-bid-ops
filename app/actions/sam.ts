'use server';

import { fetchSamOpportunity } from '@/lib/sam';

function parseNoticeId(input: string): string | null {
  const trimmed = input?.trim() || '';
  if (!trimmed) return null;
  const match = trimmed.match(/\/opp\/([a-f0-9-]{20,})/i);
  if (match) return match[1];
  if (/^[a-f0-9-]{20,}$/i.test(trimmed)) return trimmed;
  return null;
}

export async function fetchSamDataAction(urlOrNoticeId: string) {
  const noticeId = parseNoticeId(urlOrNoticeId);
  if (!noticeId) {
    return { ok: false, error: 'Could not extract notice ID from URL' };
  }

  const data = await fetchSamOpportunity(noticeId);
  if (!data) {
    return {
      ok: false,
      error: 'SAM.gov API key not configured or opportunity not found. Add SAM_GOV_API_KEY to .env.local',
    };
  }

  return { ok: true, data };
}
