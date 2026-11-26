import 'server-only';
import { ErroAutomacao, type NotaEmitida } from '@/lib/automacao/bling';
import { pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import { ehCpf, soDigitos } from '@/lib/contas/regras';
import { STORE } from '@/lib/content/store';
import { SITE_URL } from '@/lib/seo';
import { categoriasSemNcm, ncmDosProdutos } from '@/lib/automacao/ncm';

/**
 * Nota fiscal (NF-e modelo 55) pela API da Focus NFe.
 *
 * O site monta a nota a partir do pagamento aprovado; a Focus assina com o
 * certificado A1 da empresa (que fica guardado LÁ, enviado pelo painel deles)
 * e transmite à SEFAZ.
 *
 * Variáveis (Hostinger):
 *   FOCUSNFE_TOKEN       token da empresa no painel da Focus (segredo)
 *   FOCUSNFE_AMBIENTE    "producao" para notas reais. Qualquer outro valor (ou
 *                        vazio) = homologação: notas de TESTE, sem valor fiscal,
 *                        e os pedidos reais NÃO emitem (só o botão de teste do
 *                        painel).
 * Dados fiscais (o contador define; os padrões abaixo são de Simples Nacional):
 *   (NCM: por categoria, no painel em Integrações; NFE_NCM vale para as
 *    categorias sem NCM)
 *   NFE_CFOP_ESTADUAL         padrão 5102 (venda de mercadoria de terceiros, dentro de SP)
 *   NFE_CFOP_INTERESTADUAL    padrão 6102 (o mesmo, para outro estado)
 *   NFE_CSOSN                 padrão 102 (Simples sem permissão de crédito)
 *   NFE_PIS_COFINS            padrão 49 (outras operações de saída)
 *   NFE_NATUREZA              padrão "Venda de mercadoria"
 *
 * A referência da nota na Focus é o próprio código do pedido (UB-…): pedir
 * de novo nunca emite duas notas. Rejeitada pela SEFAZ, a mesma referência
 * pode ser reenviada depois de corrigir.
 */

const BASE = () => {
  if (process.env.FOCUSNFE_API_URL) return process.env.FOCUSNFE_API_URL.replace(/\/+$/, '');
  return emProducao() ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
};

export function focusConfigurada(): boolean {
  return !!process.env.FOCUSNFE_TOKEN;
}

export function emProducao(): boolean {
  return process.env.FOCUSNFE_AMBIENTE === 'producao';
}

/** O que falta para emitir (texto pro painel), ou null se está tudo certo. */
export async function faltaParaEmitir(): Promise<string | null> {
  if (!focusConfigurada()) return 'Falta FOCUSNFE_TOKEN na Hostinger.';
  const semNcm = await categoriasSemNcm().catch(() => []);
  if (semNcm.length) return `Falta o NCM de: ${semNcm.join(', ')} (Integrações → NCM por categoria).`;
  if (!STORE.inscricaoEstadual) return 'Falta a Inscrição Estadual da loja.';
  return null;
}

type RespostaFocus = {
  status?: string;
  status_sefaz?: string;
  mensagem_sefaz?: string;
  chave_nfe?: string;
  numero?: string;
  serie?: string;
  caminho_xml_nota_fiscal?: string;
  caminho_danfe?: string;
  codigo?: string;
  mensagem?: string;
  erros?: { mensagem?: string; campo?: string }[];
};

async function focus(caminho: string, init?: RequestInit): Promise<{ http: number; corpo: RespostaFocus }> {
  const token = process.env.FOCUSNFE_TOKEN;
  if (!token) throw new ErroAutomacao('A nota fiscal automática não está configurada (falta FOCUSNFE_TOKEN).');
  const r = await fetch(`${BASE()}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
  const texto = await r.text();
  if (r.status === 401) throw new ErroAutomacao('A Focus NFe recusou o token (FOCUSNFE_TOKEN errado ou de outro ambiente).');
  let corpo: RespostaFocus = {};
  try {
    corpo = texto ? (JSON.parse(texto) as RespostaFocus) : {};
  } catch {
    corpo = { mensagem: texto.slice(0, 200) };
  }
  return { http: r.status, corpo };
}

function explicar(c: RespostaFocus): string {
  const partes = [c.mensagem_sefaz || c.mensagem, ...(c.erros ?? []).map((e) => [e.campo, e.mensagem].filter(Boolean).join(': '))];
  return partes.filter(Boolean).join(' · ').slice(0, 500) || 'sem detalhes';
}

const dinheiro = (v: number) => v.toFixed(2);

/** Data e hora de agora em Brasília (formato que a SEFAZ aceita). */
function agoraEmBrasilia(): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return `${d.toISOString().slice(0, 19)}-03:00`;
}

/** Forma de pagamento no padrão da NF-e (tPag). */
function formaDaNota(p: Pagamento): string {
  switch (p.payment_type_id) {
    case 'bank_transfer':
      return '17'; // Pix
    case 'ticket':
      return '15'; // boleto
    case 'credit_card':
      return '03';
    case 'debit_card':
      return '04';
    case 'account_money':
      return '18'; // carteira digital
    default:
      return '99';
  }
}

/** Monta o JSON da NF-e a partir do pagamento aprovado. */
export function montarNota(p: Pagamento, ncms: Map<string, string>, opcoes: { teste?: boolean } = {}) {
  const m = p.metadata ?? {};
  const pecas = pecasDoPagamento(p);
  const ufDestino = (m.nf_uf || 'SP').toUpperCase();
  const interestadual = ufDestino !== STORE.coleta.uf;
  const csosn = process.env.NFE_CSOSN || '102';
  const pisCofins = process.env.NFE_PIS_COFINS || '49';

  // Inscrição Estadual da cliente: com ela, é venda para revenda (contribuinte).
  // Comprador com CPF não tem IE (é sempre não contribuinte).
  const cpf = ehCpf(m.cnpj);
  const ie = cpf ? '' : (m.nf_ie ?? '').toUpperCase();
  const indicadorIE = ie === 'ISENTO' ? '2' : ie ? '1' : '9';
  // Não contribuinte (sem IE) é sempre consumidor final para a SEFAZ.
  const consumidorFinal = indicadorIE === '1' ? '0' : '1';
  // CFOP: dentro de SP 5102; para outro estado, 6102 se o comprador é
  // contribuinte (tem IE) e 6108 se não é (CPF, ou CNPJ sem IE).
  const cfop = !interestadual
    ? process.env.NFE_CFOP_ESTADUAL || '5102'
    : indicadorIE === '1'
      ? process.env.NFE_CFOP_INTERESTADUAL || '6102'
      : process.env.NFE_CFOP_INTERESTADUAL_NAO_CONTRIBUINTE || '6108';

  // Frete rateado entre os itens (na nota, o frete é por item).
  const frete = m.entrega === 'envio' ? Number(m.frete_valor ?? 0) : 0;
  const brutos = pecas.map((i) => Math.round(Number(i.unit_price) * Number(i.quantity) * 100) / 100);
  const produtos = brutos.reduce((s, v) => s + v, 0);
  let restante = Math.round(frete * 100);
  const fretes = brutos.map((v, k) => {
    if (k === brutos.length - 1) return restante / 100;
    const parte = produtos > 0 ? Math.floor((frete * 100 * v) / produtos) : 0;
    restante -= parte;
    return parte / 100;
  });

  const nomeDestinatario = opcoes.teste ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL' : String(m.empresa || m.cliente_nome || '').slice(0, 60);

  return {
    natureza_operacao: process.env.NFE_NATUREZA || 'Venda de mercadoria',
    data_emissao: agoraEmBrasilia(),
    tipo_documento: '1',
    finalidade_emissao: '1',
    local_destino: interestadual ? '2' : '1',
    consumidor_final: consumidorFinal,
    presenca_comprador: '2', // venda pela internet
    indicador_intermediario: '0', // site próprio (o Mercado Pago só processa o pagamento)
    cnpj_emitente: soDigitos(STORE.cnpj),
    inscricao_estadual_emitente: soDigitos(STORE.inscricaoEstadual),
    nome_destinatario: nomeDestinatario,
    ...(cpf ? { cpf_destinatario: soDigitos(m.cnpj ?? '') } : { cnpj_destinatario: soDigitos(m.cnpj ?? '') }),
    indicador_inscricao_estadual_destinatario: indicadorIE,
    ...(indicadorIE === '1' ? { inscricao_estadual_destinatario: ie } : {}),
    logradouro_destinatario: m.nf_rua,
    numero_destinatario: m.nf_numero,
    ...(m.nf_complemento ? { complemento_destinatario: String(m.nf_complemento).slice(0, 60) } : {}),
    bairro_destinatario: m.nf_bairro,
    municipio_destinatario: m.nf_cidade,
    uf_destinatario: ufDestino,
    cep_destinatario: soDigitos(m.nf_cep ?? ''),
    ...(m.telefone ? { telefone_destinatario: soDigitos(m.telefone) } : {}),
    modalidade_frete: frete > 0 ? '0' : '9',
    valor_frete: dinheiro(frete),
    valor_produtos: dinheiro(produtos),
    valor_total: dinheiro(produtos + frete),
    informacoes_adicionais_contribuinte: `Pedido ${p.external_reference} pelo site ${SITE_URL.replace(/^https?:\/\//, '')}. Pagamento Mercado Pago nº ${p.id}.`,
    items: pecas.map((i, k) => ({
      numero_item: String(k + 1),
      codigo_produto: String(i.id ?? `ITEM${k + 1}`).replace(/-/g, '').slice(0, 20).toUpperCase(),
      descricao: opcoes.teste && k === 0 ? 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL' : i.title.slice(0, 120),
      codigo_ncm: ncms.get(String(i.id ?? '')) ?? '',
      cfop,
      unidade_comercial: 'UN',
      quantidade_comercial: String(Number(i.quantity)),
      valor_unitario_comercial: dinheiro(Number(i.unit_price)),
      unidade_tributavel: 'UN',
      quantidade_tributavel: String(Number(i.quantity)),
      valor_unitario_tributavel: dinheiro(Number(i.unit_price)),
      valor_bruto: dinheiro(brutos[k]!),
      ...(fretes[k]! > 0 ? { valor_frete: dinheiro(fretes[k]!) } : {}),
      icms_origem: '0',
      icms_situacao_tributaria: csosn,
      pis_situacao_tributaria: pisCofins,
      cofins_situacao_tributaria: pisCofins,
    })),
    formas_pagamento: [
      {
        indicador_pagamento: '0',
        forma_pagamento: formaDaNota(p),
        valor_pagamento: dinheiro(p.transaction_amount),
        ...(['03', '04'].includes(formaDaNota(p)) ? { tipo_integracao: '2' } : {}),
        ...(formaDaNota(p) === '99' ? { descricao_pagamento: 'Mercado Pago' } : {}),
      },
    ],
  };
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function emitida(ref: string, c: RespostaFocus): NotaEmitida {
  return {
    id: 0,
    numero: String(c.numero ?? ''),
    chave: String(c.chave_nfe ?? '').replace(/^NFe/, ''),
    // O arquivo na Focus exige o token: a cliente baixa pelo nosso site.
    danfe: `${SITE_URL}/api/nota/${ref}`,
    xml: c.caminho_xml_nota_fiscal ? `${SITE_URL}/api/nota/${ref}?formato=xml` : null,
    caminhoDanfe: c.caminho_danfe ?? null,
    caminhoXml: c.caminho_xml_nota_fiscal ?? null,
    provedor: 'focus',
    teste: !emProducao(),
  };
}

/** Consulta a nota na Focus (null se ainda não existe). */
export async function consultarNota(ref: string): Promise<RespostaFocus | null> {
  const r = await focus(`/v2/nfe/${encodeURIComponent(ref)}`);
  if (r.http === 404) return null;
  if (r.http >= 400) throw new ErroAutomacao(`Focus NFe ${r.http} ao consultar a nota: ${explicar(r.corpo)}`);
  return r.corpo;
}

/**
 * Emite (ou recupera, se já existir) a NF-e do pedido. Lança ErroAutomacao
 * com a mensagem da SEFAZ quando é rejeitada — ela aparece no painel.
 */
export async function emitirNotaFocus(
  p: Pagamento,
  opcoes: { teste?: boolean; ref?: string; ncms?: Map<string, string> } = {},
): Promise<NotaEmitida> {
  const ref = opcoes.ref ?? p.external_reference!;
  let atual = await consultarNota(ref);

  if (!atual || atual.status === 'erro_autorizacao') {
    let ncms = opcoes.ncms;
    if (!ncms) {
      try {
        ncms = await ncmDosProdutos(pecasDoPagamento(p).map((i) => String(i.id ?? '')));
      } catch (e) {
        throw new ErroAutomacao(e instanceof Error ? e.message : 'Falta o NCM das peças.');
      }
    }
    const r = await focus(`/v2/nfe?ref=${encodeURIComponent(ref)}`, { method: 'POST', body: JSON.stringify(montarNota(p, ncms, opcoes)) });
    if (r.http >= 400 && r.corpo.codigo !== 'already_processed' && r.corpo.codigo !== 'pending_operation') {
      throw new ErroAutomacao(`A Focus NFe recusou a nota: ${explicar(r.corpo)}`);
    }
    atual = r.corpo.status ? r.corpo : { status: 'processando_autorizacao' };
  }

  // A SEFAZ costuma responder em segundos.
  for (let i = 0; i < 8 && atual?.status === 'processando_autorizacao'; i++) {
    await espera(i === 0 ? 1500 : 3000);
    atual = await consultarNota(ref);
  }

  if (atual?.status === 'autorizado') return emitida(ref, atual);
  if (atual?.status === 'processando_autorizacao') {
    throw new ErroAutomacao('A SEFAZ ainda está processando a nota. Tentamos de novo automaticamente (ou clique em "Tentar de novo").');
  }
  if (atual?.status === 'erro_autorizacao') throw new ErroAutomacao(`Nota rejeitada pela SEFAZ: ${explicar(atual)}`);
  if (atual?.status === 'denegado') throw new ErroAutomacao(`Nota denegada pela SEFAZ: ${explicar(atual)}`);
  if (atual?.status === 'cancelado') throw new ErroAutomacao('A nota deste pedido foi cancelada.');
  throw new ErroAutomacao(`Situação inesperada da nota na Focus: ${atual?.status ?? 'desconhecida'}`);
}

/** Cancela a nota (a SEFAZ aceita em até 24 h depois de autorizada). */
export async function cancelarNotaFocus(ref: string, justificativa: string): Promise<void> {
  const r = await focus(`/v2/nfe/${encodeURIComponent(ref)}`, { method: 'DELETE', body: JSON.stringify({ justificativa }) });
  if (r.http >= 400 || (r.corpo.status && r.corpo.status !== 'cancelado')) {
    throw new ErroAutomacao(`Não foi possível cancelar: ${explicar(r.corpo)}`);
  }
}

/** Baixa o PDF (DANFE) ou o XML da nota, com o token (só no servidor). */
export async function baixarArquivo(caminho: string): Promise<Response> {
  const token = process.env.FOCUSNFE_TOKEN;
  if (!token || !caminho.startsWith('/')) throw new ErroAutomacao('Arquivo indisponível.');
  return fetch(`${BASE()}${caminho}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
}
