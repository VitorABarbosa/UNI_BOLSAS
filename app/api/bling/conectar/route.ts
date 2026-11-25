import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { blingConfigurado, urlDeAutorizacao } from '@/lib/automacao/bling';
import { redirectToSite } from '@/lib/public-redirect';

/** "Conectar Bling" no painel: manda o admin autorizar no Bling. */
export async function GET() {
  await requireAdmin();
  if (!blingConfigurado()) return redirectToSite('/admin/pedidos?bling=sem-chaves');
  const estado = randomBytes(16).toString('hex');
  const r = NextResponse.redirect(urlDeAutorizacao(estado));
  // O "state" volta do Bling e é conferido: impede que alguém conecte a
  // conta Bling DELE no nosso site com um link forjado.
  r.cookies.set('bling-estado', estado, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/bling', maxAge: 600 });
  return r;
}
