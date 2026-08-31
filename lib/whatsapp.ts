import { WHATSAPP_NUMBER } from '@/lib/tokens';
import { SITE_URL } from '@/lib/seo';
import { productPrice, type ShopeePricing } from '@/lib/product-price';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function waProduct(
  product: Pick<ProductRow, 'name' | 'slug' | 'price_retail'> & {
    shopee?: ShopeePricing;
  },
  color: Pick<ColorRow, 'name'> | null,
  size?: string,
): string {
  const colorPart = color ? ` na cor ${color.name}` : '';
  const sizePart = size ? ` tamanho ${size}` : '';
  // A mensagem cita o preço que a pessoa viu na tela: quem clicou vendo o
  // promocional não deve chegar no atendimento com o preço cheio.
  const price = productPrice(product);
  const priceMsg =
    product.price_retail != null
      ? ` (${price.currentLabel}${price.isPromo ? ' — promoção' : ''})`
      : '';
  // O link da peça em linha própria: no atendimento, o nome sozinho vira
  // adivinhação quando há duas parecidas. Abre a mesma página que a pessoa
  // estava vendo, com foto, cores e preço.
  const link = `${SITE_URL}/produtos/${product.slug}`;
  return waLink(
    `Olá! Tenho interesse na ${product.name}${colorPart}${sizePart}${priceMsg}. Está disponível?` +
      `\n\n${link}`,
  );
}

export const waGeneral = waLink(
  'Olá! Vim pelo catálogo Uni Bolsas e gostaria de mais informações.',
);

export const waWholesale = waLink(
  'Olá! Sou lojista e gostaria de receber a tabela de atacado da Uni Bolsas.',
);

export const waRetail = waLink(
  'Olá! Quero comprar uma bolsa. Pode me ajudar com sugestões?',
);

export function waNewsletter(type: 'wholesale' | 'retail', phone: string): string {
  const role = type === 'wholesale' ? 'lojista (atacado)' : 'cliente final';
  const phonePart = phone ? ` Meu WhatsApp é ${phone}.` : '';
  return waLink(
    `Olá! Quero receber lançamentos e novidades como ${role}.${phonePart}`,
  );
}
