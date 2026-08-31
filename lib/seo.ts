/**
 * O padrão é o domínio REAL, não localhost: este endereço vaza pra fora do
 * site — sitemap, metadados e a mensagem do WhatsApp. Quando a variável não
 * está configurada na Vercel, cair em localhost mandava o cliente clicar num
 * link que só existe na máquina de quem desenvolve. Em desenvolvimento,
 * defina NEXT_PUBLIC_SITE_URL em .env.local se precisar do endereço local.
 */
export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://unibolsas.store',
);

/**
 * Garante que o endereço sempre saia com esquema e sem barra no fim.
 *
 * A variável é digitada à mão no painel da Vercel, e as duas formas erradas
 * mais fáceis de digitar quebram coisas diferentes: sem `https://` o endereço
 * deixa de ser um link de verdade (o WhatsApp não linka domínio pelado), e
 * com barra no fim tudo que concatena um caminho vira `//caminho`.
 */
function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const SITE_NAME = 'Uni Bolsas';
