import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { melhorPagamento, mercadoPagoConfigurado, pagamentosDoPedido, pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import { listProductsForCheckout } from '@/lib/queries/products';
import { cardCoverImage } from '@/lib/product-images';
import { lerEstado, type EstadoPedido } from '@/lib/automacao/pedido';

/**
 * "Meus pedidos" sem tabela nova: a lista de códigos fica no `app_metadata`
 * da conta (que só o servidor escreve) e o status de cada pedido vem do
 * Mercado Pago, na hora.
 */

const GUARDAR = 30;
/** Quantos pedidos buscar por vez no Mercado Pago (cada um é uma consulta). */
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
export async function listarMeusPedidos(clienteId: string, refs: string[], limite = MOSTRAR): Promise<ResumoPedido[] | null> {
  if (refs.length === 0) return [];
  if (!mercadoPagoConfigurado()) return null;
  try {
    const achados = await Promise.all(
      refs.slice(0, limite).map(async (ref) => {
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

/**
 * Foto de cada peça dos pedidos (id do produto → caminho no Storage), com a
 * cor comprada quando dá pra saber pelo título ("Nome · Cor · …"). Peça que
 * saiu do catálogo fica sem foto — o pedido continua aparecendo.
 */
export async function fotosDosPedidos(pagamentos: Pagamento[]): Promise<Map<string, string>> {
  const ids = [...new Set(pagamentos.flatMap((p) => pecasDoPagamento(p).map((i) => String(i.id ?? ''))))].filter((id) =>
    /^[0-9a-f-]{36}$/i.test(id),
  );
  const fotos = new Map<string, string>();
  if (ids.length === 0) return fotos;
  try {
    for (const prod of await listProductsForCheckout(ids)) {
      const foto = cardCoverImage(prod, null) ?? (prod.images[0] ? { storage_path: prod.images[0].storage_path } : null);
      if (foto) fotos.set(prod.id, foto.storage_path);
    }
  } catch {
    // Sem fotos não é motivo pra não mostrar os pedidos.
  }
  return fotos;
}

/** Andamento (nota, etiqueta, rastreio) dos pedidos pagos. */
export async function andamentoDosPedidos(pedidos: ResumoPedido[]): Promise<Map<string, EstadoPedido>> {
  const mapa = new Map<string, EstadoPedido>();
  await Promise.all(
    pedidos
      .filter((p) => p.pagamento.status === 'approved')
      .map(async (p) => {
        const e = await lerEstado(p.ref).catch(() => null);
        if (e) mapa.set(p.ref, e);
      }),
  );
  return mapa;
}
