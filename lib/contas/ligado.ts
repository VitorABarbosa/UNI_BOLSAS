/**
 * A compra pelo site está ligada? (contas + checkout)
 *
 * LIGADO desde o lançamento. Interruptor de emergência:
 * NEXT_PUBLIC_CONTAS_ATIVAS=0 na Hostinger (e novo deploy) desliga tudo e o
 * site volta a fechar pedido pelo WhatsApp. Sem 'server-only': os textos da
 * home (Como comprar, Dúvidas) também mudam conforme isto.
 */
export const COMPRA_NO_SITE = process.env.NEXT_PUBLIC_CONTAS_ATIVAS !== '0';
