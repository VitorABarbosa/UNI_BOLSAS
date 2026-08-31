/**
 * Teto da vitrine de destaques.
 *
 * Mora aqui, e não em `featured-store`, porque a tabela do painel é um
 * componente de cliente e aquele módulo é `server-only` — importá-lo de lá
 * quebraria o build. Esta constante é só um número; o acesso ao Storage
 * continua restrito ao servidor.
 */
export const MAX_FEATURED = 12;
