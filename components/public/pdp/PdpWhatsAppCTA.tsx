'use client';

import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { productPrice, type ShopeePricing } from '@/lib/product-price';
import { waProduct } from '@/lib/whatsapp';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

type PdpWhatsAppCTAProps = {
  product: Pick<ProductRow, 'name' | 'price_retail'> & { shopee?: ShopeePricing };
  color: Pick<ColorRow, 'name'> | null;
  size?: string;
};

export function PdpWhatsAppCTA({ product, color, size }: PdpWhatsAppCTAProps) {
  return (
    // No mobile este CTA some: quem assume é a `PdpBuyBar` fixa no rodapé.
    <div className="uni-qv-cta uni-pdp-cta-inline">
      <WhatsAppButton href={waProduct(product, color, size)} full>
        Pedir no WhatsApp · {productPrice(product).currentLabel}
      </WhatsAppButton>
      <p className="uni-qv-cta-note">
        Atendimento humano · respondemos em até 5min
      </p>
    </div>
  );
}
