/**
 * A compra pelo site está ligada? (contas + checkout)
 *
 * SEMPRE LIGADA. A antiga variável NEXT_PUBLIC_CONTAS_ATIVAS é ignorada de
 * propósito: um "0" esquecido nela na hospedagem (da época em que as contas
 * ficavam escondidas) desligava a loja sem ninguém perceber.
 *
 * Interruptor de emergência, só se for preciso voltar ao pedido pelo
 * WhatsApp: NEXT_PUBLIC_COMPRA_NO_SITE=desligada na Hostinger (e novo deploy).
 * Sem 'server-only': os textos da home (Como comprar, Dúvidas) também mudam
 * conforme isto.
 */
export const COMPRA_NO_SITE = process.env.NEXT_PUBLIC_COMPRA_NO_SITE !== 'desligada';
