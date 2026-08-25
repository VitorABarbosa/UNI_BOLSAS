'use client';

import type { ProductWithRelations } from '@/lib/queries/products';
import { ColorSwatches } from './ColorSwatches';
import { SizePicker } from './SizePicker';
import { PdpWhatsAppCTA } from './PdpWhatsAppCTA';
import { productPrice } from '@/lib/product-price';

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

  const descriptionParagraphs = (product.description ?? '')
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

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
        {product.price_wholesale && (
          <span className="uni-qv-price-w">
            Atacado · {product.price_wholesale}
          </span>
        )}
      </div>
      {descriptionParagraphs.length > 0 ? (
        descriptionParagraphs.map((p, i) => (
          <p key={i} className="uni-qv-desc">
            {p}
          </p>
        ))
      ) : (
        <p className="uni-qv-desc">{product.tagline ?? ''}</p>
      )}
      <div className="uni-qv-spec-grid">
        <div>
          <div className="uni-qv-spec-label">Dimensões</div>
          <div className="uni-qv-spec-val">{product.dimensions ?? '—'}</div>
        </div>
        <div>
          <div className="uni-qv-spec-label">Peso</div>
          <div className="uni-qv-spec-val">{product.weight ?? '—'}</div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="uni-qv-spec-label">Material</div>
          <div className="uni-qv-spec-val is-text">
            {product.material ?? '—'}
          </div>
        </div>
      </div>
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
      <PdpWhatsAppCTA product={product} color={color} size={sizeForWa} />
    </div>
  );
}
