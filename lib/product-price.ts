import { formatPriceBRL } from '@/lib/format';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];

/**
 * Preço espelhado do anúncio na Shopee, quando o produto está vinculado.
 *
 * `price` é o que a Shopee cobra hoje (já com a promoção da loja aplicada) e
 * `original_price` é o preço cheio. É daí que sai o "de/por" do site — sem
 * nenhuma coluna nova em `products`.
 */
export type ShopeePricing = {
  price: number | null;
  original_price: number | null;
} | null;

export type PricedProduct = Pick<ProductRow, 'price_retail'> & {
  shopee?: ShopeePricing;
};

export type ProductPrice = {
  /** O que o cliente paga hoje. */
  current: number;
  /** Preço cheio, só quando há promoção (o "de" riscado). */
  original: number | null;
  /** Desconto arredondado, ex.: 30 para "-30%". Null sem promoção. */
  discountPct: number | null;
  isPromo: boolean;
  currentLabel: string;
  originalLabel: string | null;
};

/** Desconto pequeno demais vira ruído visual em vez de argumento de venda. */
const MIN_DISCOUNT_PCT = 3;

/**
 * Resolve o preço vigente de um produto.
 *
 * A promoção vem inteiramente da Shopee: quando o anúncio vinculado tem
 * `original_price` maior que `price`, o site mostra o "de/por". Produto sem
 * vínculo, sem promoção ativa lá, ou com o espelho indisponível simplesmente
 * mostra `price_retail` — que é o comportamento de sempre.
 */
export function productPrice(product: PricedProduct): ProductPrice {
  const retail = Number(product.price_retail);
  const plain: ProductPrice = {
    current: retail,
    original: null,
    discountPct: null,
    isPromo: false,
    currentLabel: formatPriceBRL(retail),
    originalLabel: null,
  };

  const shopee = product.shopee;
  if (!shopee || shopee.price == null || shopee.original_price == null) {
    return plain;
  }

  const current = Number(shopee.price);
  const original = Number(shopee.original_price);
  if (!(current > 0) || !(original > current)) return plain;

  const discountPct = Math.round((1 - current / original) * 100);
  if (discountPct < MIN_DISCOUNT_PCT) return plain;

  return {
    current,
    original,
    discountPct,
    isPromo: true,
    currentLabel: formatPriceBRL(current),
    originalLabel: formatPriceBRL(original),
  };
}
