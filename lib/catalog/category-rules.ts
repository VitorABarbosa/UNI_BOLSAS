/**
 * Regras de classificação automática de produto por categoria.
 *
 * Servem pra organizar de uma vez o catálogo que entrou pela importação da
 * Shopee, onde todo mundo cai numa categoria só. A classificação olha só o
 * nome do anúncio — é o único dado confiável que vem de lá.
 *
 * A ordem importa: vence a PRIMEIRA regra que casar. Por isso "mochila" vem
 * antes de tudo (mochila de viagem continua sendo mochila), "esportivas"
 * antes de "viagem" (toda peça "Sport" é esportiva, mesmo a de viagem) e
 * "viagem" antes de "bolsa" (bolsa de viagem é peça de viagem).
 *
 * Pra ajustar a classificação, mexa nas listas abaixo — nada mais precisa
 * mudar.
 */
export type CategoryRule = {
  /** Slug da categoria de destino. Precisa existir em `categories`. */
  slug: string;
  /** Nome exibido, usado quando a categoria ainda não existe. */
  label: string;
  /** Basta uma palavra casar. Compare sempre em minúsculas e sem acento. */
  keywords: string[];
  /** Se o nome tiver uma destas, a regra não vale (passa pra próxima). */
  unless?: string[];
};

export const CATEGORY_RULES: ReadonlyArray<CategoryRule> = [
  {
    slug: 'mochilas',
    label: 'Mochilas',
    keywords: ['mochila', 'backpack', 'mochilinha'],
  },
  {
    slug: 'esportivas',
    label: 'Esportivas',
    // Vem ANTES de "viagem": na Uni Bolsas toda peça "Sport" é esportiva,
    // inclusive a "Bolsa de Viagem Sport" e a "Mala ... Sport Academia".
    keywords: ['esportiva', 'esportivo', 'academia', 'treino', 'gym', 'fitness', 'sport'],
  },
  {
    slug: 'viagem',
    label: 'Viagem',
    // "Bolsa de Praia ... Passeio Piscina Viagem" é bolsa de praia.
    unless: ['praia'],
    keywords: [
      'viagem',
      'mala',
      'bordo',
      'rodinha',
      'rodinhas',
      'trolley',
      'bagagem',
      'weekender',
    ],
  },
  {
    slug: 'kits',
    label: 'Kits',
    keywords: ['kit', 'conjunto', 'combo'],
  },
  {
    slug: 'bolsas',
    label: 'Bolsas',
    keywords: [
      'bolsa',
      'necessaire',
      'nécessaire',
      'carteira',
      'transversal',
      'tiracolo',
      'clutch',
      'shoulder',
      'baguete',
      'sacola',
    ],
  },
] as const;

/** Minúsculas, sem acento — pra "nécessaire" casar com "necessaire". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export type CategorySuggestion = {
  slug: string;
  label: string;
  /** Palavra que disparou a regra — mostrada no admin pra dar confiança. */
  keyword: string;
};

/** Sugere a categoria a partir do nome do produto. Null = nenhuma regra casou. */
export function suggestCategory(productName: string): CategorySuggestion | null {
  const name = normalize(productName);
  for (const rule of CATEGORY_RULES) {
    // Casa no começo de uma palavra: "sport" pega "Sport" e "Sports", mas
    // não "transporte"; "bolsa" pega "bolsas".
    const casa = (k: string) => new RegExp(`(^|[^a-z])${normalize(k)}`).test(name);
    if (rule.unless?.some(casa)) continue;
    const keyword = rule.keywords.find(casa);
    if (keyword) return { slug: rule.slug, label: rule.label, keyword };
  }
  return null;
}
