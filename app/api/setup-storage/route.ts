import { NextResponse } from 'next/server';

const BUCKET = process.env.STORAGE_BUCKET ?? 'form-documents';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'Missing Supabase env vars' }, { status: 500 });
  }

  try {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });

    const data = await res.json().catch(() => ({}));
    const errMsg = data?.message ?? data?.error ?? data?.msg ?? '';

    if (res.ok) {
      return NextResponse.json({ ok: true, message: 'Bucket created successfully' });
    }
    if (res.status === 409 || /already exists|BucketAlreadyExists/i.test(errMsg)) {
      return NextResponse.json({ ok: true, message: 'Bucket already exists' });
    }

    return NextResponse.json(
      {
        ok: false,
        error: errMsg || `HTTP ${res.status}`,
        bucketName: BUCKET,
        manualSteps: [
          '1. Go to Supabase Dashboard → Storage',
          '2. Click "New bucket"',
          `3. Name: ${BUCKET} (must match exactly, lowercase, hyphen)`,
          '4. Toggle "Public bucket" ON',
          '5. Click Create bucket',
        ],
      },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
