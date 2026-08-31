'use client';

import { WhatsAppIcon } from '@/components/public/icons';
import { productPrice, type ShopeePricing } from '@/lib/product-price';
import { waProduct } from '@/lib/whatsapp';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

type PdpBuyBarProps = {
  product: Pick<ProductRow, 'id' | 'name' | 'price_retail'> & { shopee?: ShopeePricing };
  color: Pick<ColorRow, 'name'> | null;
  size?: string;
};

/**
 * Barra de compra fixa no rodapé — só aparece no mobile (CSS).
 *
 * Na página de produto o CTA ficava lá embaixo, depois de descrição, specs,
 * cores e tamanhos: no celular era preciso rolar a página inteira pra achar o
 * botão. Aqui o preço e o "pedir" acompanham a rolagem.
 */
export function PdpBuyBar({ product, color, size }: PdpBuyBarProps) {
  const price = productPrice(product);
  return (
    <div className="uni-pdp-buybar">
      <div className="uni-pdp-buybar-price">
        <span className="uni-pdp-buybar-label">
          {price.isPromo
            ? `${price.originalLabel} · -${price.discountPct}%`
            : color?.name
              ? `Cor ${color.name}`
              : 'A partir de'}
        </span>
        <strong className={price.isPromo ? 'is-promo' : undefined}>
          {price.currentLabel}
        </strong>
      </div>
      <a
        className="uni-pdp-buybar-cta"
        href={waProduct(product, color, size)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon size={16} />
        Pedir no WhatsApp
      </a>
    </div>
  );
}
