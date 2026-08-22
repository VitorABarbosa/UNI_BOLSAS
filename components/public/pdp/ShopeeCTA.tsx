import { StorefrontIcon } from '@/components/public/icons';
import { formatPriceBRL } from '@/lib/format';
import {
  activeShopeeOffer,
  isShopeeSoldOut,
  type ShopeeOffer,
} from '@/lib/shopee-offer';

/**
 * Secondary CTA on the PDP: the same bag, listed on our Shopee shop.
 *
 * Price and stock come from the `shopee_items` mirror (synced from the Shopee
 * Open Platform), so they can be a few hours stale — the checkout itself
 * always happens on shopee.com.br, which is the source of truth.
 *
 * Renders nothing when the product has no live Shopee listing, which is the
 * normal case for made-to-order pieces.
 */
export function ShopeeCTA({ offers }: { offers: ShopeeOffer[] | null }) {
  const offer = activeShopeeOffer(offers);
  if (!offer) return null;

  const soldOut = isShopeeSoldOut(offer);

  return (
    <div className="uni-shopee">
      <div className="uni-shopee-info">
        <span className="uni-shopee-label">Também na Shopee</span>
        {offer.price !== null && (
          <span className="uni-shopee-price">{formatPriceBRL(offer.price)}</span>
        )}
        <span className={`uni-shopee-stock${soldOut ? ' is-out' : ''}`}>
          {soldOut
            ? 'Sem estoque na Shopee no momento'
            : offer.stock !== null
              ? `${offer.stock} ${offer.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}`
              : 'Disponível para compra imediata'}
        </span>
      </div>
      <a
        href={offer.item_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`uni-shopee-btn${soldOut ? ' is-out' : ''}`}
      >
        <StorefrontIcon size={16} />
        <span>{soldOut ? 'Ver na Shopee' : 'Comprar na Shopee'}</span>
      </a>
    </div>
  );
}
