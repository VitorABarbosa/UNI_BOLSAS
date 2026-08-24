import { formatPriceBRL } from '@/lib/format';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];

/** O mínimo que o cálculo de preço precisa saber sobre um produto. */
export type PricedProduct = Pick<
  ProductRow,
  'price_retail' | 'price_promo' | 'promo_ends_at'
>;

export type ProductPrice = {
  /** O que o cliente paga hoje. */
  current: number;
  /** Preço cheio, presente só quando há promoção ativa (o "de" riscado). */
  original: number | null;
  /** Desconto arredondado, ex.: 30 para "-30%". Null sem promoção. */
  discountPct: number | null;
  isPromo: boolean;
  /** Já formatado, pra não repetir `formatPriceBRL` em cada componente. */
  currentLabel: string;
  originalLabel: string | null;
};

/**
 * Resolve o preço vigente de um produto.
 *
 * A promoção vale quando existe `price_promo`, ele é menor que o preço cheio
 * e o prazo (se houver) ainda não passou. Promoção vencida simplesmente some:
 * ninguém precisa lembrar de apagar o campo, e como as páginas revalidam a
 * cada minuto, o site se corrige sozinho.
 *
 * `now` é injetável pra manter a função testável e determinística.
 */
export function productPrice(
  product: PricedProduct,
  now: Date = new Date(),
): ProductPrice {
  const retail = Number(product.price_retail);
  const promo = product.price_promo == null ? null : Number(product.price_promo);

  const expired =
    product.promo_ends_at != null && new Date(product.promo_ends_at) <= now;
  const active = promo != null && promo > 0 && promo < retail && !expired;

  if (!active || promo == null) {
    return {
      current: retail,
      original: null,
      discountPct: null,
      isPromo: false,
      currentLabel: formatPriceBRL(retail),
      originalLabel: null,
    };
  }

  return {
    current: promo,
    original: retail,
    discountPct: Math.round((1 - promo / retail) * 100),
    isPromo: true,
    currentLabel: formatPriceBRL(promo),
    originalLabel: formatPriceBRL(retail),
  };
}
