import 'server-only';
import { listarPagamentos, mercadoPagoConfigurado, type Pagamento } from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { lerEstado, type EstadoPedido } from '@/lib/automacao/pedido';

/**
 * Os pedidos do site, do jeito que a loja trabalha: um por código (UB-…),
 * com o pagamento que vale e o andamento (nota, etiqueta, envio, retirada),
 * e em que "fila" cada um está.
 */

export type Fila = 'separar' | 'postar' | 'retirar' | 'transito' | 'problema' | 'aguardando' | 'concluido' | 'cancelado';

export const FILAS: { id: Fila; rotulo: string; selo: string; dica: string }[] = [
  { id: 'separar', rotulo: 'Separar', selo: 'Separar', dica: 'Pagos: separar as peças' },
  { id: 'postar', rotulo: 'Postar', selo: 'Postar', dica: 'Etiqueta pronta: imprimir e levar à transportadora' },
  { id: 'retirar', rotulo: 'Aguardando retirada', selo: 'Aguardando retirada', dica: 'Cliente avisada: vem buscar na loja' },
  { id: 'transito', rotulo: 'A caminho', selo: 'A caminho', dica: 'Postados, ainda não entregues' },
  { id: 'problema', rotulo: 'Com problema', selo: 'Com problema', dica: 'Nota ou etiqueta falhou' },
  { id: 'aguardando', rotulo: 'Aguardando pagamento', selo: 'Aguardando pagamento', dica: 'Pix ou boleto ainda não pagos' },
  { id: 'concluido', rotulo: 'Concluídos', selo: 'Concluído', dica: 'Entregues ou retirados' },
  { id: 'cancelado', rotulo: 'Cancelados', selo: 'Cancelado', dica: 'Recusados, cancelados ou devolvidos' },
];

/** Filas que pedem uma ação da loja. */
export const A_FAZER: Fila[] = ['separar', 'postar', 'problema'];

export type PedidoAdmin = { ref: string; pagamento: Pagamento; estado: EstadoPedido | null; fila: Fila };

const PESO: Record<string, number> = { approved: 5, authorized: 4, in_process: 3, pending: 3, in_mediation: 2, refunded: 2, charged_back: 2, rejected: 1, cancelled: 1 };

/** O erro "Bling ainda não conectado" não é problema do pedido: é configuração pendente. */
export const erroDeConfiguracao = (e: EstadoPedido | null) =>
  !!e?.erro && /ainda não está conectado|não está configurad|não configurad/i.test(e.erro.mensagem);

export function filaDo(p: Pagamento, e: EstadoPedido | null): Fila {
  if (p.status === 'pending' || p.status === 'in_process' || p.status === 'in_mediation') return 'aguardando';
  if (p.status !== 'approved' && p.status !== 'authorized') return 'cancelado';
  const retirada = p.metadata?.entrega === 'retirada';
  if (e?.entregueEm || e?.retiradoEm) return 'concluido';
  if (e?.erro && !erroDeConfiguracao(e)) return 'problema';
  if (retirada) return e?.prontoEm ? 'retirar' : 'separar';
  if (e?.postadoEm) return 'transito';
  if (e?.etiqueta) return 'postar';
  return 'separar';
}

export type ResultadoPedidos = { pedidos: PedidoAdmin[]; erro: string | null };

export async function carregarPedidos(limite = 200): Promise<ResultadoPedidos> {
  if (!mercadoPagoConfigurado()) {
    return { pedidos: [], erro: 'O Mercado Pago ainda não está configurado (falta MERCADOPAGO_ACCESS_TOKEN nas variáveis da Hostinger).' };
  }
  let pagamentos: Pagamento[];
  try {
    pagamentos = (await listarPagamentos(limite)).filter((p) => p.external_reference && REF_PEDIDO.test(p.external_reference));
  } catch (e) {
    console.error('[admin/pedidos]', e instanceof Error ? e.message : e);
    return { pedidos: [], erro: 'Não foi possível consultar o Mercado Pago agora. Atualize a página em instantes.' };
  }
  // Um pedido pode ter vários pagamentos (Pix recusado, depois cartão): vale o mais forte.
  const porRef = new Map<string, Pagamento>();
  for (const p of pagamentos) {
    const atual = porRef.get(p.external_reference!);
    if (!atual || (PESO[p.status] ?? 0) > (PESO[atual.status] ?? 0)) porRef.set(p.external_reference!, p);
  }
  const pedidos = await Promise.all(
    [...porRef.entries()].map(async ([ref, pagamento]) => {
      const pago = pagamento.status === 'approved' || pagamento.status === 'authorized';
      const estado = pago ? await lerEstado(ref).catch(() => null) : null;
      return { ref, pagamento, estado, fila: filaDo(pagamento, estado) };
    }),
  );
  pedidos.sort((a, b) => Date.parse(b.pagamento.date_created) - Date.parse(a.pagamento.date_created));
  return { pedidos, erro: null };
}

/** Busca simples: código, empresa, CNPJ, nome, e-mail ou telefone. */
export function combina(p: PedidoAdmin, q: string): boolean {
  const termo = q.trim().toLowerCase();
  if (!termo) return true;
  const m = p.pagamento.metadata ?? {};
  const digitos = termo.replace(/\D/g, '');
  const campos = [p.ref, m.empresa, m.cliente_nome, m.cliente_email].map((x) => String(x ?? '').toLowerCase());
  if (campos.some((c) => c.includes(termo))) return true;
  return digitos.length >= 4 && [m.cnpj, m.telefone].some((x) => String(x ?? '').replace(/\D/g, '').includes(digitos));
}

/** Link do WhatsApp da cliente (número brasileiro). */
export function whatsDaCliente(telefone: string | undefined, texto: string): string | null {
  const d = String(telefone ?? '').replace(/\D/g, '');
  if (d.length < 10) return null;
  const num = d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}
