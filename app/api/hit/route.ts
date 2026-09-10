import { NextResponse, type NextRequest } from 'next/server';
import { recordHit, type HitKind } from '@/lib/analytics/store';

/**
 * Registro de evento. O navegador de quem visita chama isto a cada troca de
 * página e a cada clique no botão do WhatsApp
 * (components/public/shell/SiteAnalytics e lib/analytics/client).
 *
 * Privacidade, nas regras da LGPD:
 * - O cookie `uni_vid` (id anônimo, sem nome, sem e-mail, sem IP guardado) só
 *   é criado se a pessoa ACEITOU no aviso de cookies (`uni_consent=all`) —
 *   base legal: consentimento (art. 7º, I).
 * - Quem escolheu "só o essencial" ainda conta como visita — número agregado,
 *   sem cookie, sem id, impossível de ligar a alguém. Base legal: legítimo
 *   interesse (art. 7º, IX), no limite estrito de saber quanta gente entrou.
 * - Revogar o consentimento apaga o id no ato (art. 8º, §5º): o cookie é
 *   expirado na primeira requisição que chega sem `uni_consent=all`.
 * - Nada aqui bloqueia a página: a resposta volta na hora e a gravação é
 *   melhor-esforço.
 *
 * O IP chega ao servidor porque é assim que a internet funciona, mas não é
 * lido nem gravado em lugar nenhum deste arquivo.
 */
const CONSENT = 'uni_consent';
const VID = 'uni_vid';
const VID_DAYS = 180;

const newVid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Caminho interno, sem query, tamanho contido. Fora disso vira a home. */
function safePath(raw: unknown): string {
  const p = typeof raw === 'string' ? raw : '/';
  return /^\/[a-zA-Z0-9\-_/]*$/.test(p) && p.length <= 120 ? p : '/';
}

export async function POST(request: NextRequest) {
  let body: { path?: unknown; ref?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind: HitKind = body.kind === 'wa' ? 'wa' : 'view';
  const path = safePath(body.path);

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
  const rawVid = request.cookies.get(VID)?.value ?? null;
  const existingVid = rawVid && /^[a-z0-9]{8,16}$/.test(rawVid) ? rawVid : null;
  const allowVid = consent === 'all';
  const vid = allowVid ? (existingVid ?? newVid()) : null;

  await recordHit({
    path,
    ref,
    device,
    vid,
    kind,
    isNew: allowVid && existingVid === null,
  });

  const res = NextResponse.json({ ok: true });
  if (allowVid && vid && vid !== rawVid) {
    res.cookies.set(VID, vid, {
      maxAge: VID_DAYS * 86400,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
    });
  }
  // A pessoa voltou atrás no consentimento: o id morre junto.
  if (!allowVid && rawVid) {
    res.cookies.set(VID, '', { maxAge: 0, path: '/' });
  }
  return res;
}
