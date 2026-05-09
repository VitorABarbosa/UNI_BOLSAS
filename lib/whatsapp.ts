import { WHATSAPP_NUMBER } from '@/lib/tokens';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function waProduct(
  product: Pick<ProductRow, 'name' | 'price_retail'>,
  color: Pick<ColorRow, 'name'> | null,
  size?: string,
): string {
  const colorPart = color ? ` na cor ${color.name}` : '';
  const sizePart = size ? ` tamanho ${size}` : '';
  const priceMsg =
    product.price_retail != null
      ? ` (R$ ${product.price_retail.toFixed(2).replace('.', ',')})`
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
