'use client';

import { useState } from 'react';
import { BagIcon, WhatsAppIcon } from '@/components/public/icons';
import { WaLink } from '@/components/public/primitives/WaLink';
import { usePedido } from '@/hooks/usePedido';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { adicionarAoPedido, abrirPedido, itemKey, QTD_MAXIMA } from '@/lib/pedido';
import { productPrice, type ShopeePricing } from '@/lib/product-price';
import { waProduct } from '@/lib/whatsapp';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];

export type PecaDoPedido = Pick<ProductRow, 'id' | 'slug' | 'name' | 'price_retail'> & {
  shopee?: ShopeePricing;
};

/** Os dados que entram no pedido, a partir da peça e da escolha na tela. */
export function itemDaPeca(
  product: PecaDoPedido,
  color: Pick<ColorRow, 'name'> | null,
  size: string | undefined,
  image: string | null,
) {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    colorName: color?.name ?? null,
    size: size ?? null,
    unitPrice: productPrice(product).current,
    image,
  };
}

/**
 * Quantidade + "Adicionar ao pedido", na página da peça e na visualização
 * rápida. A pergunta avulsa no WhatsApp continua ali embaixo, menor: tem quem
 * só queira saber se a cor chegou antes de montar o pedido.
 */
export function AdicionarAoPedido({
  product,
  color,
  size,
  image,
  className,
}: {
  product: PecaDoPedido;
  color: Pick<ColorRow, 'name'> | null;
  size?: string;
  image: string | null;
  className?: string;
}) {
  const [qty, setQty] = useState(1);
  const pedido = usePedido();
  const key = itemKey(product.id, color?.name ?? null, size ?? null);
  const naLista = pedido.find((i) => i.key === key)?.qty ?? 0;
  const price = productPrice(product);

  const clamp = (n: number) => Math.max(1, Math.min(QTD_MAXIMA, Math.floor(n) || 1));

  return (
    <div className={'uni-add ' + (className ?? '')}>
      <div className="uni-add-row">
        <div className="uni-qty" role="group" aria-label="Quantidade">
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q - 1))}
            disabled={qty <= 1}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={QTD_MAXIMA}
            value={qty}
            onChange={(e) => setQty(clamp(Number(e.target.value)))}
            aria-label="Quantidade"
          />
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q + 1))}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="uni-add-btn"
          onClick={() => {
            adicionarAoPedido(itemDaPeca(product, color, size, image), qty);
            setQty(1);
          }}
        >
          <BagIcon size={17} />
          {COMPRA_NO_SITE ? 'Comprar' : 'Adicionar ao pedido'}
          <span className="uni-add-btn-preco"> · {price.currentLabel}</span>
        </button>
      </div>
      <p className="uni-add-note">
        {naLista > 0 ? (
          <>
            Você já tem <strong>{naLista}</strong> desta no pedido.{' '}
            <button type="button" className="uni-add-link" onClick={abrirPedido}>
              Ver pedido
            </button>
          </>
        ) : (
          <>Pedido mínimo de {PEDIDO_MINIMO} peças, somando todos os modelos.</>
        )}
      </p>
      {COMPRA_NO_SITE && (
        <ul className="uni-confianca" aria-label="Como funciona a compra">
          <li>Pagamento seguro pelo Mercado Pago</li>
          <li>Pix, cartão ou boleto</li>
          <li>Envio para todo o Brasil</li>
          <li>Nota fiscal</li>
        </ul>
      )}
      <WaLink
        href={waProduct(product, color, size)}
        trackPath={`/produtos/${product.slug}`}
        className="uni-add-ask"
      >
        <WhatsAppIcon size={14} />
        Tirar dúvida sobre esta peça
      </WaLink>
    </div>
  );
}
