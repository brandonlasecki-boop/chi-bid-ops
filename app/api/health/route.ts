import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('contracts').select('id').limit(1);
    if (error) {
      const hint = error.code === '42P01' ? 'Run migrations: 001_initial_schema.sql and 002_progress_function.sql' : error.message;
      return NextResponse.json({ ok: false, error: error.message, hint }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: msg, hint: 'Check .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' },
      { status: 503 }
    );
  }
}
