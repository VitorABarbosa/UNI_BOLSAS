import { formatPriceBRL } from '@/lib/format';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];

/**
 * Preço espelhado do anúncio na Shopee, quando o produto está vinculado.
 * `price` é o que a Shopee cobra hoje (promoção já aplicada) e
 * `original_price` é o preço cheio.
 */
export type ShopeePricing = {
  price: number | null;
  original_price: number | null;
} | null;

/** Campanha do painel à qual o produto pertence. */
export type CampaignPricing = {
  id: string;
  name: string;
  discount_kind: string;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

export type PricedProduct = Pick<ProductRow, 'price_retail'> & {
  shopee?: ShopeePricing;
  /** Vem de `campaign_products`; vazio ou ausente quando não há campanha. */
  campaigns?: { campaign: CampaignPricing | null }[] | null;
};

export type ProductPrice = {
  /** O que o cliente paga hoje. */
  current: number;
  /** Preço cheio, só quando há desconto (o "de" riscado). */
  original: number | null;
  discountPct: number | null;
  isPromo: boolean;
  /** Nome da campanha, quando o desconto vier de uma. */
  campaignName: string | null;
  currentLabel: string;
  originalLabel: string | null;
};

/** Desconto pequeno demais vira ruído visual em vez de argumento de venda. */
const MIN_DISCOUNT_PCT = 3;

/** A campanha vale se estiver ligada e dentro do período. */
export function isCampaignRunning(
  campaign: CampaignPricing,
  now: Date = new Date(),
): boolean {
  if (!campaign.active) return false;
  if (campaign.starts_at && new Date(campaign.starts_at) > now) return false;
  if (campaign.ends_at && new Date(campaign.ends_at) <= now) return false;
  return true;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Preço da peça sob a campanha, ou null se a campanha não a barateia. */
function campaignPrice(
  retail: number,
  campaign: CampaignPricing,
): number | null {
  const value = Number(campaign.discount_value);
  if (!(value > 0)) return null;
  const price =
    campaign.discount_kind === 'fixed'
      ? round2(value)
      : round2(retail * (1 - value / 100));
  if (!(price > 0) || price >= retail) return null;
  return price;
}

/**
 * Resolve o preço vigente de um produto.
 *
 * Duas origens de desconto podem coexistir: a promoção da Shopee (espelhada)
 * e a campanha montada no painel. **Vale a mais barata** — quotar acima do
 * que a pessoa acha na Shopee seria pior que não ter desconto nenhum.
 *
 * Sem nenhuma das duas, ou com as tabelas indisponíveis, mostra
 * `price_retail` — o comportamento de sempre.
 */
export function productPrice(
  product: PricedProduct,
  now: Date = new Date(),
): ProductPrice {
  const retail = Number(product.price_retail);
  const plain: ProductPrice = {
    current: retail,
    original: null,
    discountPct: null,
    isPromo: false,
    campaignName: null,
    currentLabel: formatPriceBRL(retail),
    originalLabel: null,
  };

  /**
   * Cada origem traz o próprio "de". Importa porque o sync da Shopee grava o
   * preço JÁ promocional em `price_retail` — usar o retail como preço cheio
   * apagaria o desconto justamente nos produtos vindos de lá.
   */
  const candidates: {
    price: number;
    original: number;
    campaignName: string | null;
  }[] = [];

  const shopee = product.shopee;
  if (shopee?.price != null && shopee.original_price != null) {
    const current = Number(shopee.price);
    const full = Number(shopee.original_price);
    if (current > 0 && full > current) {
      candidates.push({ price: current, original: full, campaignName: null });
    }
  }

  for (const link of product.campaigns ?? []) {
    const campaign = link?.campaign;
    if (!campaign || !isCampaignRunning(campaign, now)) continue;
    const price = campaignPrice(retail, campaign);
    if (price != null) {
      candidates.push({ price, original: retail, campaignName: campaign.name });
    }
  }

  if (candidates.length === 0) return plain;

  // A mais barata vence; empate mantém a primeira (Shopee), que é a que a
  // pessoa encontraria fora do site.
  const best = candidates.reduce((a, b) => (b.price < a.price ? b : a));
  const original = Math.max(best.original, retail);
  const discountPct = Math.round((1 - best.price / original) * 100);
  if (discountPct < MIN_DISCOUNT_PCT) return plain;

  return {
    current: best.price,
    original,
    discountPct,
    isPromo: true,
    campaignName: best.campaignName,
    currentLabel: formatPriceBRL(best.price),
    originalLabel: formatPriceBRL(original),
  };
}
