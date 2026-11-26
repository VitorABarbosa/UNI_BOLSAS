import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';

/**
 * Os textos que o Google mostra (título e descrição) e as palavras que a
 * lojista digita pra achar a loja. Com a compra pelo site ligada, falam de
 * loja online: comprar, pagar com Pix/cartão/boleto, receber em todo o
 * Brasil. Desligada, voltam ao pedido pelo WhatsApp.
 */

export const TITULO_INICIO = COMPRA_NO_SITE
  ? 'Uni Bolsas — Bolsas no atacado online · Compre direto do Brás'
  : 'Uni Bolsas — Bolsas no atacado · Brás SP';

export const DESCRICAO_INICIO = COMPRA_NO_SITE
  ? `Loja online de bolsas, mochilas e malas no atacado, direto do Brás (SP). Compre pelo site a partir de ${PEDIDO_MINIMO} peças, pague com Pix, cartão ou boleto e receba em todo o Brasil com nota fiscal.`
  : `Bolsas, mochilas e malas no atacado, a partir de ${PEDIDO_MINIMO} peças, direto do nosso stand no Shopping 900, Brás · São Paulo. Pedido pelo WhatsApp.`;

/** Termos de busca (o Google quase não usa, mas outros buscadores e lojas de app sim). */
export const PALAVRAS_CHAVE = [
  'bolsas no atacado',
  'bolsas atacado online',
  'comprar bolsas no atacado',
  'bolsas atacado Brás',
  'bolsas femininas atacado',
  'mochilas atacado',
  'malas atacado',
  'fornecedor de bolsas',
  'bolsas para revenda',
  'atacado de bolsas São Paulo',
  'loja de bolsas atacado com envio para todo o Brasil',
];

export const tituloPeca = (nome: string) =>
  COMPRA_NO_SITE ? `${nome} no atacado — compre online · Uni Bolsas` : `${nome} no atacado — Uni Bolsas`;

export const descricaoPecaPadrao = (nome: string) =>
  COMPRA_NO_SITE
    ? `Compre ${nome} no atacado pelo site: a partir de ${PEDIDO_MINIMO} peças, Pix, cartão ou boleto, envio para todo o Brasil com nota fiscal.`
    : `${nome} no atacado, a partir de ${PEDIDO_MINIMO} peças, direto do Brás.`;
