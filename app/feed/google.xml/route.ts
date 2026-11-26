import { listActiveProducts } from '@/lib/queries/products';
import { feedGoogle } from '@/lib/feed-google';

/**
 * https://unibolsas.store/feed/google.xml — o catálogo no formato do Google
 * Merchant Center. Sempre o catálogo de agora (peça ocultada some do feed).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const xml = feedGoogle(await listActiveProducts());
    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' },
    });
  } catch (e) {
    console.error('[feed google]', e instanceof Error ? e.message : e);
    return new Response('Catálogo indisponível agora.', { status: 503 });
  }
}
