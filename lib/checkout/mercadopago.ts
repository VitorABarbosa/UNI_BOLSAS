import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Conversa com a API do Mercado Pago (Checkout Pro).
 *
 * Só o servidor fala com o Mercado Pago, com o Access Token das variáveis de
 * ambiente (`MERCADOPAGO_ACCESS_TOKEN`). O token nunca vai pro navegador.
 *
 * O pedido não fica guardado no nosso banco: ele vive no próprio Mercado
 * Pago. Cada pagamento leva a referência do pedido (`UB-…`) e os dados da
 * cliente em `metadata`; o painel de pedidos e os avisos leem de lá.
 */

/** Só pra teste local (um Mercado Pago de mentira). Em produção, vazio. */
const API = (process.env.MERCADOPAGO_API_URL || 'https://api.mercadopago.com').replace(/\/+$/, '');

export function mercadoPagoConfigurado(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

class ErroMercadoPago extends Error {
  constructor(
    public status: number,
    corpo: string,
  ) {
    super(`Mercado Pago respondeu ${status}: ${corpo.slice(0, 300)}`);
  }
}

async function mp<T>(caminho: string, init?: RequestInit & { idempotencia?: string }): Promise<T> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  const r = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.idempotencia ? { 'X-Idempotency-Key': init.idempotencia } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new ErroMercadoPago(r.status, await r.text());
  return (await r.json()) as T;
}

// ─── Preferência (o "carrinho" que o Mercado Pago cobra) ────────────────────

/** Dados gravados no pagamento. O Mercado Pago aceita só chaves em snake_case. */
export type MetadataPedido = {
  pedido: string;
  cliente_id: string;
  cliente_email: string;
  cliente_nome: string;
  empresa: string;
  cnpj: string;
  telefone: string;
  entrega: 'retirada' | 'combinar';
  endereco: string;
};

export type ItemPreferencia = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export async function criarPreferencia(p: {
  ref: string;
  itens: ItemPreferencia[];
  pagador: { nome: string; email: string };
  metadata: MetadataPedido;
  urlRetorno: string;
  urlAviso: string;
}): Promise<{ id: string; url: string }> {
  const corpo = {
    items: p.itens.map((i) => ({ ...i, currency_id: 'BRL' })),
    payer: { name: p.pagador.nome, email: p.pagador.email },
    external_reference: p.ref,
    metadata: p.metadata,
    back_urls: { success: p.urlRetorno, pending: p.urlRetorno, failure: p.urlRetorno },
    auto_return: 'approved',
    notification_url: p.urlAviso,
    statement_descriptor: 'UNIBOLSAS',
    // Pix e boleto liberam o pedido depois; o link de pagamento vale 3 dias.
    expires: true,
    expiration_date_to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const r = await mp<{ id: string; init_point: string }>('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(corpo),
    idempotencia: p.ref,
  });
  return { id: r.id, url: r.init_point };
}

// ─── Pagamentos ─────────────────────────────────────────────────────────────

export type Pagamento = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference: string | null;
  date_created: string;
  date_approved: string | null;
  transaction_amount: number;
  payment_type_id?: string;
  installments?: number;
  metadata?: Partial<MetadataPedido> | null;
  additional_info?: { items?: { id?: string; title: string; quantity: string | number; unit_price: string | number }[] } | null;
};

export async function buscarPagamento(id: string | number): Promise<Pagamento | null> {
  if (!/^\d{1,20}$/.test(String(id))) return null;
  try {
    return await mp<Pagamento>(`/v1/payments/${id}`);
  } catch (e) {
    if (e instanceof ErroMercadoPago && e.status === 404) return null;
    throw e;
  }
}

/** Os pagamentos mais recentes, do mais novo pro mais antigo. */
export async function listarPagamentos(limite = 50): Promise<Pagamento[]> {
  const q = new URLSearchParams({ sort: 'date_created', criteria: 'desc', limit: String(limite) });
  const r = await mp<{ results: Pagamento[] }>(`/v1/payments/search?${q}`);
  return r.results ?? [];
}

/** Os pagamentos de um pedido (pode haver mais de um: Pix recusado, depois cartão). */
export async function pagamentosDoPedido(ref: string): Promise<Pagamento[]> {
  const q = new URLSearchParams({ external_reference: ref, sort: 'date_created', criteria: 'desc' });
  const r = await mp<{ results: Pagamento[] }>(`/v1/payments/search?${q}`);
  return r.results ?? [];
}

// ─── Aviso (webhook) ────────────────────────────────────────────────────────

/**
 * Confere a assinatura do aviso do Mercado Pago (cabeçalho `x-signature`),
 * com a "assinatura secreta" da tela de Webhooks do painel deles.
 *
 * Formato: `ts=<tempo>,v1=<hmac>`; o HMAC-SHA256 é feito sobre
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
 */
export function assinaturaValida(p: { assinatura: string | null; requestId: string | null; dataId: string; segredo: string }): boolean {
  if (!p.assinatura) return false;
  const partes = Object.fromEntries(
    p.assinatura.split(',').map((kv) => {
      const [k, ...v] = kv.split('=');
      return [k?.trim(), v.join('=').trim()];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const id = /^[a-z0-9]+$/i.test(p.dataId) ? p.dataId.toLowerCase() : p.dataId;
  let manifesto = `id:${id};`;
  if (p.requestId) manifesto += `request-id:${p.requestId};`;
  manifesto += `ts:${ts};`;
  const esperado = createHmac('sha256', p.segredo).update(manifesto).digest('hex');
  const a = Buffer.from(esperado, 'hex');
  const b = Buffer.from(v1.toLowerCase(), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Textos ─────────────────────────────────────────────────────────────────

export function statusEmPortugues(s: string): string {
  return (
    {
      approved: 'Pago',
      authorized: 'Autorizado',
      pending: 'Aguardando pagamento',
      in_process: 'Em análise',
      in_mediation: 'Em disputa',
      rejected: 'Recusado',
      cancelled: 'Cancelado',
      refunded: 'Devolvido',
      charged_back: 'Estornado',
    } as Record<string, string>
  )[s] ?? s;
}

export function formaDePagamento(p: Pagamento): string {
  const t = p.payment_type_id;
  if (t === 'bank_transfer') return 'Pix';
  if (t === 'ticket') return 'Boleto';
  if (t === 'credit_card') return p.installments && p.installments > 1 ? `Cartão ${p.installments}x` : 'Cartão';
  if (t === 'debit_card') return 'Débito';
  if (t === 'account_money') return 'Saldo Mercado Pago';
  return t ?? '—';
}
