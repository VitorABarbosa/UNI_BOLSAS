'use client';

import type { ProductWithRelations } from '@/lib/queries/products';
import { ColorSwatches } from './ColorSwatches';
import { SizePicker } from './SizePicker';
import { FichaPeca } from './FichaPeca';
import { AdicionarAoPedido } from '@/components/public/pedido/AdicionarAoPedido';
import { cardCoverImage } from '@/lib/product-images';
import { productPrice } from '@/lib/product-price';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';

type ProductInfoProps = {
  product: ProductWithRelations;
  colorIdx: number;
  sizeIdx: number;
  onColorChange: (idx: number) => void;
  onSizeChange: (idx: number) => void;
};

export function ProductInfo({
  product,
  colorIdx,
  sizeIdx,
  onColorChange,
  onSizeChange,
}: ProductInfoProps) {
  const color = product.colors[colorIdx] ?? product.colors[0] ?? null;
  const price = productPrice(product);
  const sizeForWa =
    product.sizes && product.sizes.length > 1
      ? product.sizes[sizeIdx]
      : undefined;

  return (
    <div className="uni-qv-info">
      <div className="uni-qv-eyebrow">
        {product.category?.label ?? ''}
        {product.badge ? ' · ' + product.badge : ''}
      </div>
      <h1 className="uni-pdp-name">{product.name}</h1>
      <div className="uni-qv-price-row">
        <span className="uni-qv-price">{price.currentLabel}</span>
        {price.originalLabel && (
          <>
            <s className="uni-qv-price-was">{price.originalLabel}</s>
            <span className="uni-qv-price-off">-{price.discountPct}%</span>
          </>
        )}
        {price.campaignName && (
          <span className="uni-qv-price-campaign">{price.campaignName}</span>
        )}
        <span className="uni-qv-price-w">
          Atacado ·{' '}
          {product.price_wholesale ?? `pedido mínimo de ${PEDIDO_MINIMO} peças`}
        </span>
      </div>
      <FichaPeca ficha={product} />
      {/* Peça sem cor cadastrada (comum nas importadas) não mostra "Cor: —". */}
      {product.colors.length > 0 && (
        <div className="uni-qv-color-section">
          <div className="uni-qv-section-label">
            Cor: <strong>{color?.name ?? '—'}</strong>
          </div>
          <ColorSwatches
            colors={product.colors}
            activeIdx={colorIdx}
            onChange={onColorChange}
          />
        </div>
      )}
      {product.sizes && product.sizes.length > 1 && (
        <div className="uni-qv-size-section">
          <div className="uni-qv-section-label">
            Tamanho: <strong>{product.sizes[sizeIdx]}</strong>
          </div>
          <SizePicker
            sizes={product.sizes}
            activeIdx={sizeIdx}
            onChange={onSizeChange}
          />
        </div>
      )}
      <AdicionarAoPedido
        product={product}
        color={color}
        size={sizeForWa}
        image={cardCoverImage(product, color)?.storage_path ?? null}
      />
    </div>
  );
}
