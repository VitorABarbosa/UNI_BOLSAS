/**
 * Números da medição que também aparecem no texto da política.
 *
 * Ficam num arquivo à parte, sem `server-only`, pra que a página pública de
 * privacidade possa citá-los sem arrastar junto o cliente de serviço do
 * Supabase — e, mais importante, pra que o prazo publicado e o prazo aplicado
 * sejam literalmente o mesmo número.
 */

/**
 * Por quanto tempo os resumos diários ficam guardados (LGPD art. 15 e 16: o
 * dado é eliminado quando o tratamento acaba). Um ano fechado permite
 * comparar a temporada deste ano com a do ano passado, que é o uso real do
 * número.
 */
export const RETAIN_DAYS = 365;
