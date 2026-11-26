import 'server-only';
import { blingConectado, blingConfigurado, emitirNota as emitirNotaBling, ErroAutomacao, type NotaEmitida } from '@/lib/automacao/bling';
import { emProducao, emitirNotaFocus, faltaParaEmitir, focusConfigurada } from '@/lib/automacao/focus';
import type { Pagamento } from '@/lib/checkout/mercadopago';

/**
 * Quem emite a nota: a Focus NFe (se FOCUSNFE_TOKEN existe) ou o Bling.
 * Devolve o motivo quando não dá pra emitir nota de verdade agora. As
 * mensagens têm "não está configurada": o painel trata como pendência de
 * configuração, não como problema do pedido.
 */
export async function podeEmitir(): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (focusConfigurada()) {
    const falta = faltaParaEmitir();
    if (falta) return { ok: false, motivo: `A nota fiscal automática não está configurada: ${falta}` };
    if (!emProducao()) {
      return { ok: false, motivo: 'A nota fiscal automática não está configurada para produção (Focus NFe em modo de teste).' };
    }
    return { ok: true };
  }
  if (blingConfigurado() && (await blingConectado()).conectado) return { ok: true };
  return { ok: false, motivo: 'A nota fiscal automática não está configurada: a nota não foi emitida.' };
}

export async function emitirNotaDoPedido(p: Pagamento): Promise<NotaEmitida> {
  const pode = await podeEmitir();
  if (!pode.ok) throw new ErroAutomacao(pode.motivo);
  return focusConfigurada() ? emitirNotaFocus(p) : emitirNotaBling(p);
}
