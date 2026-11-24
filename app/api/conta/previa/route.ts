import { NextResponse, type NextRequest } from 'next/server';
import { chavePreviaConfere, COOKIE_PREVIA, COOKIE_PREVIA_VISIVEL, hashPrevia } from '@/lib/contas/acesso';
import { dentroDoLimite, MINUTO } from '@/lib/contas/limite';
import { redirectToSite } from '@/lib/public-redirect';

/**
 * Liga (ou desliga, com `?sair=1`) a prévia das contas NESTE navegador.
 *
 * Uso: unibolsas.store/api/conta/previa?chave=<CONTAS_PREVIA_CHAVE>
 * Chave errada responde 404, igual a uma rota que não existe.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  if (url.searchParams.get('sair') === '1') {
    const r = redirectToSite('/');
    r.cookies.delete(COOKIE_PREVIA);
    r.cookies.delete(COOKIE_PREVIA_VISIVEL);
    return r;
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
  const chave = url.searchParams.get('chave');
  if (!dentroDoLimite(`previa:${ip}`, 10, 15 * MINUTO) || !chavePreviaConfere(chave)) {
    return new NextResponse('Not found', { status: 404 });
  }
  // Endereço público, nunca o da requisição: atrás da Hostinger ele é o
  // interno (0.0.0.0:3000). Ver lib/public-redirect.ts.
  const r = redirectToSite('/conta/entrar');
  const comum = { sameSite: 'lax' as const, path: '/', maxAge: 30 * 24 * 60 * 60, secure: process.env.NODE_ENV === 'production' };
  r.cookies.set(COOKIE_PREVIA, hashPrevia(chave!), { ...comum, httpOnly: true });
  r.cookies.set(COOKIE_PREVIA_VISIVEL, '1', comum);
  r.headers.set('Referrer-Policy', 'no-referrer');
  r.headers.set('Cache-Control', 'no-store');
  return r;
}
