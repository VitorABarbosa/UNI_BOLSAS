'use client';

import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { formatPriceBRL } from '@/lib/format';
import { waProduct } from '@/lib/whatsapp';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

type PdpWhatsAppCTAProps = {
  product: Pick<ProductRow, 'name' | 'price_retail'>;
  color: Pick<ColorRow, 'name'> | null;
  size?: string;
};

export function PdpWhatsAppCTA({ product, color, size }: PdpWhatsAppCTAProps) {
  return (
    <div className="uni-qv-cta">
      <WhatsAppButton href={waProduct(product, color, size)} full>
        Pedir no WhatsApp · {formatPriceBRL(product.price_retail)}
      </WhatsAppButton>
      <p className="uni-qv-cta-note">
        Atendimento humano · respondemos em até 5min
      </p>
    </div>
  );
}
