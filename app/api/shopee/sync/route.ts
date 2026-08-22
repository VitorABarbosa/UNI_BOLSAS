import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { syncShopeeCatalog } from '@/lib/shopee/sync';

/**
 * Catalog sync endpoint.
 *
 * Called by the Vercel cron (daily, see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. The cron doubles as the token keeper:
 * `syncShopeeCatalog` refreshes the access token first, which keeps the
 * 30-day refresh token alive without any separate job.
 *
 * The admin panel triggers the same work through a Server Action, not this
 * route, so a session is never enough to run it here.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado' },
      { status: 503 },
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncShopeeCatalog();
    revalidatePath('/');
    for (const slug of result.affectedSlugs) revalidatePath(`/produtos/${slug}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[shopee] sync falhou:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
