/**
 * "Novidade" é a peça cadastrada nos últimos dias — sem ninguém precisar
 * marcar. A lojista volta ao site atrás do que chegou; isto mostra o que
 * chegou.
 */
export const NOVIDADE_DIAS = 14;

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Os ids das novidades, ou nenhum.
 *
 * Fica vazio quando "novo" deixaria de significar alguma coisa: se mais da
 * metade do catálogo entrou de uma vez (uma importação da Shopee, por
 * exemplo), marcar quase tudo como novidade é o mesmo que não marcar nada.
 *
 * Calculado no servidor, na hora de montar a página: com a data do servidor,
 * o selo é o mesmo no HTML e na tela, sem piscar na hidratação.
 */
export function novidadesIds(
  products: ReadonlyArray<{ id: string; created_at?: string | null }>,
  agora: number = Date.now(),
): string[] {
  const corte = agora - NOVIDADE_DIAS * DIA_MS;
  const ids = products
    .filter((p) => p.created_at && Date.parse(p.created_at) >= corte)
    .map((p) => p.id);
  if (ids.length > products.length / 2) return [];
  return ids;
}
