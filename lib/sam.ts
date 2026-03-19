/**
 * Fetch opportunity details from SAM.gov Contract Opportunities API.
 * Requires SAM_GOV_API_KEY in env. Get one at: https://sam.gov (Account Details)
 * Rate limits: 10/day (basic), 1000/day (entity-registered)
 * @see https://open.gsa.gov/api/get-opportunities-public-api/
 */
export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string | null;
  fullParentPathName: string | null;
  postedDate: string | null;
  type: string | null;
  baseType: string | null;
  setAside: string | null;
  setAsideCode: string | null;
  responseDeadLine: string | null;
  naicsCode: string | null;
  classificationCode: string | null;
  pointOfContact: Array<{
    fullName?: string;
    email?: string;
    phone?: string;
    title?: string;
    type?: string;
  }>;
  placeOfPerformance: {
    streetAddress?: string;
    city?: string | { name?: string };
    state?: string | { code?: string; name?: string };
    zip?: string;
    country?: string | { code?: string; name?: string };
  } | null;
  officeAddress: {
    city?: string;
    state?: string;
    zipcode?: string;
    countryCode?: string;
  } | null;
  description?: string;
  resourceLinks?: string[];
  [key: string]: unknown;
}

function getDateRange(): { postedFrom: string; postedTo: string } {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  return { postedFrom: fmt(twoYearsAgo), postedTo: fmt(now) };
}

export async function fetchSamOpportunity(
  noticeId: string
): Promise<SamOpportunity | null> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return null;

  const { postedFrom, postedTo } = getDateRange();
  const params = new URLSearchParams({
    api_key: apiKey,
    noticeid: noticeId,
    postedFrom,
    postedTo,
    limit: '1',
    offset: '0',
  });

  const url = `https://api.sam.gov/opportunities/v2/search?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error('SAM.gov API error:', res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    opportunitiesData?: SamOpportunity[];
    totalRecords?: number;
  };

  const opp = data.opportunitiesData?.[0];
  return opp ?? null;
}
