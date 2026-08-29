/**
 * "Essa tabela não existe" tem DOIS códigos, e é fácil só conhecer um.
 *
 * Quando o PostgREST consegue falar com o Postgres e a relação não existe, o
 * erro vem como `42P01` (undefined_table, do próprio Postgres). Mas o Supabase
 * mantém um cache do schema, e quando a tabela nunca esteve lá o pedido morre
 * antes de virar SQL: aí o código é `PGRST205` e a mensagem é "Could not find
 * the table 'public.x' in the schema cache".
 *
 * O segundo é justamente o caso de uma migration que nunca foi aplicada — ou
 * seja, o mais comum. Checar só `42P01` faz a tela cair no ramo genérico e
 * mostrar a mensagem crua em inglês, em vez de explicar o que rodar.
 */
const MISSING_TABLE_CODES = new Set([
  '42P01', // Postgres: undefined_table
  'PGRST205', // PostgREST: tabela ausente no cache de schema
]);

export function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code != null && MISSING_TABLE_CODES.has(error.code);
}
