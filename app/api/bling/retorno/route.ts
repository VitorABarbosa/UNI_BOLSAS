import { type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { concluirConexao } from '@/lib/automacao/bling';
import { redirectToSite } from '@/lib/public-redirect';

/** Volta do Bling depois de autorizar. */
export async function GET(req: NextRequest) {
  await requireAdmin();
  const codigo = req.nextUrl.searchParams.get('code');
  const estado = req.nextUrl.searchParams.get('state');
  const esperado = req.cookies.get('bling-estado')?.value;
  if (!codigo || !estado || !esperado || estado !== esperado) return redirectToSite('/admin/integracoes?bling=recusado');
  try {
    await concluirConexao(codigo);
  } catch (e) {
    console.error('[bling] conexão falhou:', e instanceof Error ? e.message : e);
    return redirectToSite('/admin/integracoes?bling=erro');
  }
  const r = redirectToSite('/admin/integracoes?bling=ok');
  r.cookies.delete({ name: 'bling-estado', path: '/api/bling' });
  return r;
}
