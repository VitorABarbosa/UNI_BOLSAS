import { NextResponse, type NextRequest } from 'next/server';
import { recordHit } from '@/lib/analytics/store';

/**
 * Registro de visita. O navegador de quem visita chama isto a cada troca de
 * página (components/public/shell/SiteAnalytics).
 *
 * Privacidade, nas regras da LGPD:
 * - O cookie `uni_vid` (id anônimo, sem nome, sem e-mail, sem IP guardado) só
 *   é criado se a pessoa ACEITOU no aviso de cookies (`uni_consent=all`).
 * - Quem escolheu "só o essencial" ainda conta como visita — número agregado,
 *   sem cookie, sem id, impossível de ligar a alguém.
 * - Nada aqui bloqueia a página: a resposta volta na hora e a gravação é
 *   melhor-esforço.
 */
const CONSENT = 'uni_consent';
const VID = 'uni_vid';
const VID_DAYS = 180;

const newVid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function POST(request: NextRequest) {
  let body: { path?: unknown; ref?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Caminho: interno, sem query, tamanho contido. Qualquer coisa fora disso
  // vira a home — melhor um dado impreciso que um endpoint que aceita lixo.
  const rawPath = typeof body.path === 'string' ? body.path : '/';
  const path =
    /^\/[a-zA-Z0-9\-_/]*$/.test(rawPath) && rawPath.length <= 120
      ? rawPath
      : '/';
  // O painel de admin não é audiência.
  if (path.startsWith('/admin') || path.startsWith('/api')) {
    return NextResponse.json({ ok: true });
  }

  // Origem: só o hostname, e só quando é site externo.
  let ref: string | null = null;
  if (typeof body.ref === 'string' && body.ref) {
    try {
      const host = new URL(body.ref).hostname;
      if (host && host !== request.nextUrl.hostname) ref = host.slice(0, 60);
    } catch {
      /* referrer inválido não é motivo pra rejeitar a visita */
    }
  }

  const ua = request.headers.get('user-agent') ?? '';
  const device: 'm' | 'd' = /Mobi|Android|iPhone/i.test(ua) ? 'm' : 'd';

  const consent = request.cookies.get(CONSENT)?.value;
  const existingVid = request.cookies.get(VID)?.value ?? null;
  const allowVid = consent === 'all';
  const vid = allowVid
    ? (existingVid && /^[a-z0-9]{8,16}$/.test(existingVid)
        ? existingVid
        : newVid())
    : null;

  await recordHit({ path, ref, device, vid });

  const res = NextResponse.json({ ok: true });
  if (allowVid && vid && vid !== existingVid) {
    res.cookies.set(VID, vid, {
      maxAge: VID_DAYS * 86400,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
    });
  }
  // A pessoa voltou atrás no consentimento: o id morre junto.
  if (!allowVid && existingVid) {
    res.cookies.set(VID, '', { maxAge: 0, path: '/' });
  }
  return res;
}
