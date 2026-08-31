/**
 * O padrão é o domínio REAL, não localhost: este endereço vaza pra fora do
 * site — sitemap, metadados e a mensagem do WhatsApp. Quando a variável não
 * está configurada na Vercel, cair em localhost mandava o cliente clicar num
 * link que só existe na máquina de quem desenvolve. Em desenvolvimento,
 * defina NEXT_PUBLIC_SITE_URL em .env.local se precisar do endereço local.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://unibolsas.store';

export const SITE_NAME = 'Uni Bolsas';
