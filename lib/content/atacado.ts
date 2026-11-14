/**
 * A regra de venda da casa: só atacado, com pedido mínimo.
 *
 * Mora num lugar só porque aparece em toda parte — faixa do topo, hero,
 * cards, página da peça, FAQ, mensagem do WhatsApp — e um número que muda em
 * nove lugares é um número que um dia fica errado em um deles.
 */
export const PEDIDO_MINIMO = 3;

/** "a partir de 3 peças" — pra entrar no meio de uma frase. */
export const PEDIDO_MINIMO_FRASE = `a partir de ${PEDIDO_MINIMO} peças`;

/** "Mín. 3 peças" — pro espaço curto do card. */
export const PEDIDO_MINIMO_CURTO = `Mín. ${PEDIDO_MINIMO} peças`;
