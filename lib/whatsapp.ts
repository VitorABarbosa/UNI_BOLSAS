import { WHATSAPP_NUMBER } from '@/lib/tokens';
import { productPrice } from '@/lib/product-price';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function waProduct(
  product: Pick<ProductRow, 'name' | 'price_retail'> &
    Partial<Pick<ProductRow, 'price_promo' | 'promo_ends_at'>>,
  color: Pick<ColorRow, 'name'> | null,
  size?: string,
): string {
  const colorPart = color ? ` na cor ${color.name}` : '';
  const sizePart = size ? ` tamanho ${size}` : '';
  // A mensagem precisa citar o preço que a pessoa viu na tela — se ela clicou
  // vendo o promocional, chegar no atendimento com o preço cheio é ruído.
  const price = productPrice({
    price_retail: product.price_retail,
    price_promo: product.price_promo ?? null,
    promo_ends_at: product.promo_ends_at ?? null,
  });
  const priceMsg =
    product.price_retail != null
      ? ` (${price.currentLabel}${price.isPromo ? ' — promoção' : ''})`
      : '';
  return waLink(
    `Olá! Tenho interesse na ${product.name}${colorPart}${sizePart}${priceMsg}. Está disponível?`,
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
