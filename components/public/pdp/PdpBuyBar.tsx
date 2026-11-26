'use client';

import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { BagIcon } from '@/components/public/icons';
import {
  itemDaPeca,
  type PecaDoPedido,
} from '@/components/public/pedido/AdicionarAoPedido';
import { usePedido } from '@/hooks/usePedido';
import { PEDIDO_MINIMO_CURTO } from '@/lib/content/atacado';
import { abrirPedido, adicionarAoPedido, resumoPedido } from '@/lib/pedido';
import { productPrice } from '@/lib/product-price';
import type { Database } from '@/types/db';

type ColorRow = Database['public']['Tables']['product_colors']['Row'];

type PdpBuyBarProps = {
  product: PecaDoPedido;
  color: Pick<ColorRow, 'name'> | null;
  size?: string;
  image: string | null;
};

/**
 * Barra fixa no rodapé — só aparece no celular (CSS).
 *
 * O bloco de quantidade fica no meio da página, depois da descrição e das
 * medidas; esta barra acompanha a rolagem pra peça entrar no pedido de onde a
 * pessoa estiver. Com o pedido já começado, ela também leva até ele.
 */
export function PdpBuyBar({ product, color, size, image }: PdpBuyBarProps) {
  const price = productPrice(product);
  const { pecas } = resumoPedido(usePedido());
  return (
    <div className="uni-pdp-buybar">
      <div className="uni-pdp-buybar-price">
        <span className="uni-pdp-buybar-label">
          {price.isPromo
            ? `${price.originalLabel} · -${price.discountPct}%`
            : PEDIDO_MINIMO_CURTO}
        </span>
        <strong className={price.isPromo ? 'is-promo' : undefined}>
          {price.currentLabel}
        </strong>
      </div>
      {pecas > 0 && (
        <button
          type="button"
          className="uni-pdp-buybar-pedido"
          onClick={abrirPedido}
          aria-label={`Ver pedido, ${pecas} ${pecas === 1 ? 'peça' : 'peças'}`}
        >
          <BagIcon size={18} />
          <span>{pecas}</span>
        </button>
      )}
      <button
        type="button"
        className="uni-pdp-buybar-cta"
        onClick={() => adicionarAoPedido(itemDaPeca(product, color, size, image))}
      >
        <BagIcon size={16} />
        {COMPRA_NO_SITE ? 'Comprar' : 'Adicionar'}
      </button>
    </div>
  );
}
