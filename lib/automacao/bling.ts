import 'server-only';
import { lerJson, gravarJson } from '@/lib/automacao/armazem';
import { soDigitos } from '@/lib/contas/regras';
import type { Pagamento } from '@/lib/checkout/mercadopago';
import { pecasDoPagamento } from '@/lib/checkout/mercadopago';
import { SITE_URL } from '@/lib/seo';

/**
 * Bling (API v3): nota fiscal automática.
 *
 * Conexão: o admin clica "Conectar Bling" no painel, autoriza no Bling e
 * volta pra `/api/bling/retorno`. O acesso (access token, 6 h) e a renovação
 * (refresh token, que o Bling troca a cada uso) ficam num JSON privado do
 * Storage — nunca no código nem no navegador.
 *
 * Variáveis: BLING_CLIENT_ID e BLING_CLIENT_SECRET, do aplicativo criado em
 * Bling → Central de extensões → Área do integrador. URL de retorno do app:
 * https://unibolsas.store/api/bling/retorno
 *
 * Fluxo da nota, a partir de um pagamento aprovado:
 *   contato (acha pelo CNPJ ou cria) → produtos (acha pelo código ou cria,
 *   com o NCM) → pedido de venda (número da loja = UB-…) → gerar NF-e →
 *   enviar à SEFAZ → ler número, chave e DANFE.
 * Cada passo procura antes de criar, então repetir é seguro.
 */

const API = () => (process.env.BLING_API_URL || 'https://api.bling.com.br/Api/v3').replace(/\/+$/, '');
const AUTORIZAR = () => process.env.BLING_AUTH_URL || 'https://www.bling.com.br/Api/v3/oauth/authorize';
const ARQUIVO = 'integracoes/bling.json';

export const URL_RETORNO_BLING = `${SITE_URL}/api/bling/retorno`;

type Tokens = { access_token: string; refresh_token: string; expira_em: number; conectado_em: string };

export function blingConfigurado(): boolean {
  return !!(process.env.BLING_CLIENT_ID && process.env.BLING_CLIENT_SECRET);
}

export async function blingConectado(): Promise<{ conectado: boolean; desde?: string }> {
  if (!blingConfigurado()) return { conectado: false };
  const t = await lerJson<Tokens>(ARQUIVO);
  return t?.refresh_token ? { conectado: true, desde: t.conectado_em } : { conectado: false };
}

export function urlDeAutorizacao(estado: string): string {
  const u = new URL(AUTORIZAR());
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', process.env.BLING_CLIENT_ID!);
  u.searchParams.set('state', estado);
  return u.toString();
}

async function pedirToken(corpo: Record<string, string>): Promise<Tokens> {
  const basic = Buffer.from(`${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${API()}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: '1.0' },
    body: new URLSearchParams(corpo),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`Bling recusou o token (${r.status}): ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
  const t: Tokens = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expira_em: Date.now() + (j.expires_in - 120) * 1000,
    conectado_em: new Date().toISOString(),
  };
  await gravarJson(ARQUIVO, t);
  return t;
}

/** Troca o código da autorização pelos tokens (volta do Bling). */
export async function concluirConexao(codigo: string): Promise<void> {
  await pedirToken({ grant_type: 'authorization_code', code: codigo });
}

let renovando: Promise<Tokens> | null = null;

async function token(forcarRenovacao = false): Promise<string> {
  const t = await lerJson<Tokens>(ARQUIVO);
  if (!t?.refresh_token) throw new ErroAutomacao('O Bling não está conectado. Conecte no painel (Pedidos → Conectar Bling).');
  if (!forcarRenovacao && Date.now() < t.expira_em) return t.access_token;
  // Uma renovação por vez: o Bling invalida o refresh token usado, e duas
  // renovações simultâneas derrubariam a conexão.
  renovando ??= pedirToken({ grant_type: 'refresh_token', refresh_token: t.refresh_token }).finally(() => {
    renovando = null;
  });
  return (await renovando).access_token;
}

export class ErroAutomacao extends Error {}

async function bling<T>(caminho: string, init?: RequestInit, tentativa = 0): Promise<T> {
  const r = await fetch(`${API()}${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${await token(tentativa > 0)}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
  if (r.status === 401 && tentativa === 0) return bling<T>(caminho, init, 1);
  const texto = await r.text();
  if (!r.ok) throw new ErroAutomacao(`Bling ${r.status} em ${caminho.split('?')[0]}: ${mensagemDoBling(texto)}`);
  return (texto ? JSON.parse(texto) : {}) as T;
}

function mensagemDoBling(texto: string): string {
  try {
    const j = JSON.parse(texto) as { error?: { message?: string; description?: string; fields?: { msg?: string }[] } };
    const e = j.error;
    return [e?.description || e?.message, ...(e?.fields ?? []).map((f) => f.msg)].filter(Boolean).join(' · ').slice(0, 400) || texto.slice(0, 200);
  } catch {
    return texto.slice(0, 200);
  }
}

// ─── Nota fiscal ───────────────────────────────────────────────────────────

export type NotaEmitida = {
  id: number;
  numero: string;
  chave: string;
  danfe: string | null;
  xml: string | null;
  /** Focus NFe: caminhos dos arquivos lá (baixados pelo nosso /api/nota/…). */
  caminhoDanfe?: string | null;
  caminhoXml?: string | null;
  provedor?: 'bling' | 'focus';
  /** Emitida em homologação (sem valor fiscal). */
  teste?: boolean;
  cancelada?: string;
};

/** Situações do Bling em que a NF-e está autorizada pela SEFAZ. */
const AUTORIZADA = new Set([5, 6, 7]);

/** O código do produto no Bling: estável e curto (o id do site sem traços). */
const codigoProduto = (id: string) => `UB${id.replace(/-/g, '').slice(0, 16).toUpperCase()}`;

async function contatoId(p: Pagamento): Promise<number> {
  const m = p.metadata ?? {};
  const doc = soDigitos(m.cnpj ?? '');
  const achado = await bling<{ data: { id: number }[] }>(`/contatos?numeroDocumento=${doc}`);
  if (achado.data?.[0]?.id) return achado.data[0].id;
  const criado = await bling<{ data: { id: number } }>('/contatos', {
    method: 'POST',
    body: JSON.stringify({
      nome: m.empresa,
      tipo: 'J',
      situacao: 'A',
      numeroDocumento: doc,
      email: m.cliente_email,
      celular: soDigitos(m.telefone ?? ''),
      endereco: {
        geral: {
          endereco: m.nf_rua,
          numero: m.nf_numero,
          complemento: m.nf_complemento ?? '',
          bairro: m.nf_bairro,
          cep: soDigitos(m.nf_cep ?? ''),
          municipio: m.nf_cidade,
          uf: m.nf_uf,
        },
      },
    }),
  });
  return criado.data.id;
}

async function garantirProduto(codigo: string, nome: string, preco: number): Promise<void> {
  const achado = await bling<{ data: { id: number }[] }>(`/produtos?codigos[]=${encodeURIComponent(codigo)}`);
  if (achado.data?.length) return;
  const ncm = soDigitos(process.env.BLING_NCM ?? '');
  await bling('/produtos', {
    method: 'POST',
    body: JSON.stringify({
      nome: nome.slice(0, 120),
      codigo,
      preco,
      tipo: 'P',
      situacao: 'A',
      formato: 'S',
      unidade: 'UN',
      ...(ncm ? { tributacao: { ncm } } : {}),
    }),
  });
}

/**
 * Emite (ou recupera, se já existir) a NF-e do pedido. Lança ErroAutomacao
 * com a mensagem do Bling/SEFAZ quando algo falha — ela aparece no painel.
 */
export async function emitirNota(p: Pagamento, notaIdExistente?: number): Promise<NotaEmitida> {
  const ref = p.external_reference!;
  let notaId = notaIdExistente;

  if (!notaId) {
    // Pedido de venda: procura pelo número da loja antes de criar.
    const existente = await bling<{ data: { id: number; notaFiscal?: { id?: number } }[] }>(
      `/pedidos/vendas?numerosLojas[]=${encodeURIComponent(ref)}`,
    );
    let pedidoId = existente.data?.[0]?.id;
    notaId = existente.data?.[0]?.notaFiscal?.id || undefined;

    if (!pedidoId) {
      const contato = await contatoId(p);
      const pecas = pecasDoPagamento(p);
      for (const i of pecas) await garantirProduto(codigoProduto(String(i.id ?? i.title)), i.title, Number(i.unit_price));
      const freteValor = Number(p.metadata?.frete_valor ?? 0);
      const criado = await bling<{ data: { id: number } }>('/pedidos/vendas', {
        method: 'POST',
        body: JSON.stringify({
          numeroLoja: ref,
          data: p.date_created.slice(0, 10),
          contato: { id: contato },
          itens: pecas.map((i) => ({
            codigo: codigoProduto(String(i.id ?? i.title)),
            descricao: i.title.slice(0, 120),
            unidade: 'UN',
            quantidade: Number(i.quantity),
            valor: Number(i.unit_price),
          })),
          transporte: { fretePorConta: 0, frete: freteValor },
          observacoes: `Pedido ${ref} · pago pelo site (Mercado Pago nº ${p.id})`,
          observacoesInternas: `Site unibolsas.store · ${p.metadata?.entrega === 'retirada' ? 'retirada na loja' : `envio ${p.metadata?.frete ?? ''}`}`,
        }),
      });
      pedidoId = criado.data.id;
    }

    if (!notaId) {
      const nf = await bling<{ data: { id: number } }>(`/pedidos/vendas/${pedidoId}/gerar-nfe`, { method: 'POST' });
      notaId = nf.data.id;
    }
  }

  let nota = await lerNota(notaId);
  if (!AUTORIZADA.has(nota.situacao)) {
    await bling(`/nfe/${notaId}/enviar`, { method: 'POST' });
    // A SEFAZ costuma responder em segundos; espera um pouco antes de ler.
    for (let i = 0; i < 6 && !AUTORIZADA.has(nota.situacao); i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 1500 : 3000));
      nota = await lerNota(notaId);
    }
  }
  if (!AUTORIZADA.has(nota.situacao) || !nota.chaveAcesso) {
    throw new ErroAutomacao(
      `A NF-e ${nota.numero ?? notaId} não foi autorizada ainda (situação ${nota.situacao} no Bling). Veja o motivo no Bling e tente de novo.`,
    );
  }
  return { id: notaId, numero: String(nota.numero), chave: nota.chaveAcesso, danfe: nota.linkDanfe ?? null, xml: nota.xml ?? null };
}

async function lerNota(id: number) {
  const r = await bling<{ data: { situacao: number; numero?: string; chaveAcesso?: string; linkDanfe?: string; xml?: string } }>(`/nfe/${id}`);
  return r.data;
}
