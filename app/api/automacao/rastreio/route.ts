import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { checarPedidos } from '@/lib/automacao/pedido';
import { enviarResumosNaHora } from '@/lib/notificar/resumos';

/**
 * Checagem automática dos pedidos, chamada de hora em hora pelo GitHub
 * Actions (.github/workflows/pedidos.yml) com
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * Atualiza rastreio/postagem/entrega dos pedidos enviados (e manda os
 * e-mails de atualização) e tenta de novo nota/etiqueta que tinham falhado.
 * Também manda o resumo do dia (a partir das 20h) e o da semana (segunda,
 * a partir das 8h), no celular e por e-mail.
 * É seguro chamar quantas vezes for: cada passo e cada e-mail roda uma vez.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function autorizado(req: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || segredo.length < 16) return false;
  const a = Buffer.from(req.headers.get('authorization') ?? '');
  const b = Buffer.from(`Bearer ${segredo}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ ok: false, erro: 'CRON_SECRET não configurado' }, { status: 503 });
  if (!autorizado(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const checagem = await checarPedidos();
    // Resumo do dia (20h) e da semana (segunda, 8h): falhar aqui não derruba a checagem.
    const resumos = await enviarResumosNaHora().catch((e) => {
      console.error('[resumos] falhou:', e instanceof Error ? e.message : e);
      return [] as string[];
    });
    return NextResponse.json({ ok: true, ...checagem, resumos });
  } catch (e) {
    console.error('[checagem] falhou:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
