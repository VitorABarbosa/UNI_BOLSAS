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
  product: Pick<ProductRow, 'id' | 'name' | 'price_retail'> & {
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
  // O link identifica a peça no atendimento — nome sozinho vira adivinhação
  // quando há duas parecidas. É o link CURTO (/p/<código>) porque o endereço
  // completo de /produtos/<slug> passa de 100 caracteres e engole a mensagem.
  //
  // COM o `https://`, que a primeira versão tirava. A aposta era que o
  // WhatsApp linkaria o domínio pelado; ele não linka — `.store` não está na
  // lista de terminações que o detector dele adivinha, então
  // `unibolsas.store/p/4a0d56ea` chegava como texto morto, sem cor e sem
  // toque. Com o esquema são 34 caracteres, que não atrapalham nada.
  const link = `${SITE_URL}/p/${product.id.replace(/-/g, '').slice(0, 8)}`;
  // *asteriscos* viram negrito no WhatsApp — o nome da peça salta da mensagem.
  return waLink(
    `Olá! Tenho interesse na *${product.name}*${colorPart}${sizePart}${priceMsg}. Está disponível?` +
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
