'use server';

import { randomBytes } from 'node:crypto';
import { contasLiberadas } from '@/lib/contas/acesso';
import { clienteAtual } from '@/lib/contas/sessao';
import { dentroDoLimite, MINUTO } from '@/lib/contas/limite';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { SITE_URL } from '@/lib/seo';
import { cotarPedido } from '@/lib/checkout/cotacao';
import { criarPreferencia, mercadoPagoConfigurado } from '@/lib/checkout/mercadopago';
import { registrarPedido } from '@/lib/checkout/meus-pedidos';
import { embalar, resumoCaixas, type Volume } from '@/lib/frete/caixas';
import { cotarFrete, melhorEnvioConfigurado, prazoEmTexto, type OpcaoFrete } from '@/lib/frete/melhorenvio';
import { soDigitos } from '@/lib/contas/regras';
import {
  enderecoEmLinha,
  enderecoSchema,
  itensEnviadosSchema,
  type Cotacao,
  type EntregaTipo,
} from '@/lib/checkout/tipos';

/**
 * Ações do checkout. Regras que o navegador não consegue burlar:
 *  - só cliente logada, com e-mail confirmado e dados da loja preenchidos;
 *  - preço, total e disponibilidade recalculados aqui, a partir do banco;
 *  - mínimo de peças conferido aqui também;
 *  - o link de pagamento só sai do Mercado Pago (nunca montado a partir de
 *    algo que veio do navegador).
 */

export type ResultadoCotacao = { ok: true; cotacao: Cotacao } | { ok: false; erro: string };

export async function cotar(itens: unknown): Promise<ResultadoCotacao> {
  if (!(await contasLiberadas())) return { ok: false, erro: 'Compra pelo site ainda não está disponível.' };
  if (!(await clienteAtual())) return { ok: false, erro: 'Entre na sua conta para continuar.' };
  const p = itensEnviadosSchema.safeParse(itens);
  if (!p.success) return { ok: false, erro: 'Seu pedido está vazio.' };
  try {
    return { ok: true, cotacao: await cotarPedido(p.data) };
  } catch (e) {
    console.error('[checkout] cotação falhou:', e instanceof Error ? e.message : e);
    return { ok: false, erro: 'Não conseguimos carregar seu pedido agora. Tente de novo.' };
  }
}

export type ResultadoFrete =
  | { ok: true; opcoes: OpcaoFrete[]; caixas: string }
  | { ok: false; erro: string; semCalculo?: boolean };

/** Volumes do pedido e as opções de frete pro CEP. Tudo recalculado aqui. */
async function freteDoPedido(cotacao: Cotacao, cep: string): Promise<{ volumes: Volume[]; opcoes: OpcaoFrete[] }> {
  const volumes = embalar(cotacao.linhas.map((l) => ({ ...l.fisico, qty: l.qty })));
  const opcoes = await cotarFrete({ cepDestino: cep, volumes, valorDeclarado: cotacao.total });
  return { volumes, opcoes };
}

export async function cotarEnvio(itens: unknown, cep: string): Promise<ResultadoFrete> {
  if (!(await contasLiberadas())) return { ok: false, erro: 'Compra pelo site ainda não está disponível.' };
  const cliente = await clienteAtual();
  if (!cliente) return { ok: false, erro: 'Entre na sua conta para continuar.' };
  if (!melhorEnvioConfigurado()) return { ok: false, erro: 'Cálculo de frete indisponível.', semCalculo: true };
  if (soDigitos(String(cep ?? '')).length !== 8) return { ok: false, erro: 'Digite o CEP com 8 números.' };
  if (!dentroDoLimite(`frete:${cliente.id}`, 20, 10 * MINUTO)) return { ok: false, erro: 'Muitas consultas seguidas. Espere alguns minutos.' };
  const p = itensEnviadosSchema.safeParse(itens);
  if (!p.success) return { ok: false, erro: 'Seu pedido está vazio.' };
  try {
    const cotacao = await cotarPedido(p.data);
    if (cotacao.linhas.length === 0) return { ok: false, erro: 'Seu pedido está vazio.' };
    const { volumes, opcoes } = await freteDoPedido(cotacao, cep);
    if (opcoes.length === 0) {
      return { ok: false, erro: 'Nenhuma transportadora atende esse CEP com este pedido. Escolha "frete a combinar".', semCalculo: true };
    }
    return { ok: true, opcoes, caixas: resumoCaixas(volumes) };
  } catch (e) {
    console.error('[frete] cotação falhou:', e instanceof Error ? e.message : e);
    return { ok: false, erro: 'Não conseguimos calcular o frete agora. Tente de novo ou escolha "frete a combinar".', semCalculo: true };
  }
}

export type ResultadoPagamento =
  | { ok: true; url: string }
  | { ok: false; erro: string; campos?: Record<string, string> };

export async function iniciarPagamento(entrada: {
  itens: unknown;
  entrega: EntregaTipo;
  endereco?: unknown;
  /** id do serviço do Melhor Envio escolhido (só com entrega 'envio'). */
  servicoFrete?: number;
}): Promise<ResultadoPagamento> {
  if (!(await contasLiberadas())) return { ok: false, erro: 'Compra pelo site ainda não está disponível.' };
  if (!mercadoPagoConfigurado()) {
    console.error('[checkout] MERCADOPAGO_ACCESS_TOKEN ausente');
    return { ok: false, erro: 'O pagamento pelo site está indisponível no momento. Fale com a gente pelo WhatsApp.' };
  }
  const cliente = await clienteAtual();
  if (!cliente) return { ok: false, erro: 'Sua sessão terminou. Entre de novo na sua conta.' };
  const { nome, empresa, cnpj, telefone } = cliente.perfil;
  if (!nome || !empresa || !cnpj || !telefone) {
    return { ok: false, erro: 'Complete os dados da sua loja em "Minha conta" antes de pagar.' };
  }
  if (!dentroDoLimite(`pagar:${cliente.id}`, 10, 10 * MINUTO)) {
    return { ok: false, erro: 'Muitas tentativas seguidas. Espere alguns minutos.' };
  }

  const itens = itensEnviadosSchema.safeParse(entrada.itens);
  if (!itens.success) return { ok: false, erro: 'Seu pedido está vazio.' };

  if (entrada.entrega !== 'retirada' && entrada.entrega !== 'combinar' && entrada.entrega !== 'envio') {
    return { ok: false, erro: 'Escolha como quer receber.' };
  }
  let endereco = '';
  let cepEnvio = '';
  if (entrada.entrega !== 'retirada') {
    const e = enderecoSchema.safeParse(entrada.endereco);
    if (!e.success) {
      const campos: Record<string, string> = {};
      for (const i of e.error.issues) campos[String(i.path[0])] ??= i.message;
      return { ok: false, erro: 'Confira o endereço de entrega.', campos };
    }
    endereco = enderecoEmLinha(e.data);
    cepEnvio = e.data.cep;
  }

  let cotacao: Cotacao;
  try {
    cotacao = await cotarPedido(itens.data);
  } catch (e) {
    console.error('[checkout] cotação falhou:', e instanceof Error ? e.message : e);
    return { ok: false, erro: 'Não conseguimos conferir seu pedido agora. Tente de novo.' };
  }
  if (cotacao.removidas.length > 0) {
    return { ok: false, erro: 'Algumas peças mudaram de disponibilidade. Recarregue a página para ver o pedido atualizado.' };
  }
  if (cotacao.pecas < PEDIDO_MINIMO) {
    return { ok: false, erro: `O pedido mínimo é de ${PEDIDO_MINIMO} peças.` };
  }

  // Frete calculado: cota de novo AQUI. O preço do frete nunca vem do navegador.
  let frete: { opcao: OpcaoFrete; caixas: string } | null = null;
  if (entrada.entrega === 'envio') {
    if (!melhorEnvioConfigurado()) return { ok: false, erro: 'Cálculo de frete indisponível. Escolha "frete a combinar".' };
    try {
      const { volumes, opcoes } = await freteDoPedido(cotacao, cepEnvio);
      const opcao = opcoes.find((o) => o.id === entrada.servicoFrete);
      if (!opcao) return { ok: false, erro: 'O frete escolhido mudou. Calcule o frete de novo.' };
      frete = { opcao, caixas: resumoCaixas(volumes) };
    } catch (e) {
      console.error('[frete] recotação falhou:', e instanceof Error ? e.message : e);
      return { ok: false, erro: 'Não conseguimos confirmar o frete agora. Tente de novo ou escolha "frete a combinar".' };
    }
  }

  const ref = `UB-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
  try {
    const { url } = await criarPreferencia({
      ref,
      itens: cotacao.linhas.map((l) => ({
        id: l.productId,
        title: [l.nome, l.cor, l.tamanho && `Tam. ${l.tamanho}`].filter(Boolean).join(' · ').slice(0, 250),
        quantity: l.qty,
        unit_price: l.unitPrice,
      })).concat(
        frete
          ? [{
              id: 'frete',
              title: `Frete · ${frete.opcao.transportadora} ${frete.opcao.nome} (${prazoEmTexto(frete.opcao)})`.slice(0, 250),
              quantity: 1,
              unit_price: frete.opcao.preco,
            }]
          : [],
      ),
      metadata: {
        pedido: ref,
        cliente_id: cliente.id,
        cliente_email: cliente.email,
        cliente_nome: nome,
        empresa,
        cnpj,
        telefone,
        entrega: entrada.entrega,
        endereco,
        frete: frete ? `${frete.opcao.transportadora} ${frete.opcao.nome} · ${prazoEmTexto(frete.opcao)}` : '',
        frete_valor: frete ? frete.opcao.preco : 0,
        caixas: frete?.caixas ?? '',
      },
      urlRetorno: `${SITE_URL}/pedido/${ref}`,
      urlAviso: `${SITE_URL}/api/mercadopago/aviso`,
    });
    const destino = new URL(url);
    const teste = !!process.env.MERCADOPAGO_API_URL;
    if (!teste && (destino.protocol !== 'https:' || !/(^|\.)mercadopago\.com(\.br)?$/.test(destino.hostname))) {
      throw new Error(`link de pagamento inesperado: ${destino.hostname}`);
    }
    await registrarPedido(cliente.id, ref);
    return { ok: true, url: destino.toString() };
  } catch (e) {
    console.error('[checkout] criar preferência falhou:', e instanceof Error ? e.message : e);
    return { ok: false, erro: 'Não conseguimos abrir o pagamento agora. Tente de novo em alguns minutos.' };
  }
}
