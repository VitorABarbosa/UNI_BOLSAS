import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { melhorPagamento, mercadoPagoConfigurado, pagamentosDoPedido, type Pagamento } from '@/lib/checkout/mercadopago';

/**
 * "Meus pedidos" sem tabela nova: a lista de códigos fica no `app_metadata`
 * da conta (que só o servidor escreve) e o status de cada pedido vem do
 * Mercado Pago, na hora.
 */

const GUARDAR = 30;
const MOSTRAR = 10;

/** Pendura o código do pedido na conta da cliente. Falhar aqui não impede a compra. */
export async function registrarPedido(clienteId: string, ref: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(clienteId);
    if (error || !data.user) throw error ?? new Error('conta não encontrada');
    const atual = (data.user.app_metadata as Record<string, unknown> | undefined)?.pedidos;
    const lista = Array.isArray(atual) ? atual.filter((r): r is string => typeof r === 'string' && REF_PEDIDO.test(r)) : [];
    const pedidos = [ref, ...lista.filter((r) => r !== ref)].slice(0, GUARDAR);
    const { error: e2 } = await admin.auth.admin.updateUserById(clienteId, { app_metadata: { pedidos } });
    if (e2) throw e2;
  } catch (e) {
    console.error('[meus-pedidos] não registrou', ref, e instanceof Error ? e.message : e);
  }
}

export type ResumoPedido = { ref: string; pagamento: Pagamento };

/**
 * Os pedidos recentes que chegaram a ter pagamento (checkout abandonado antes
 * de pagar não aparece). `null` quando o Mercado Pago não respondeu.
 */
export async function listarMeusPedidos(clienteId: string, refs: string[]): Promise<ResumoPedido[] | null> {
  if (refs.length === 0) return [];
  if (!mercadoPagoConfigurado()) return null;
  try {
    const achados = await Promise.all(
      refs.slice(0, MOSTRAR).map(async (ref) => {
        const p = melhorPagamento(await pagamentosDoPedido(ref), clienteId);
        return p ? { ref, pagamento: p } : null;
      }),
    );
    return achados.filter((x): x is ResumoPedido => x !== null);
  } catch (e) {
    console.error('[meus-pedidos] consulta falhou:', e instanceof Error ? e.message : e);
    return null;
  }
}
