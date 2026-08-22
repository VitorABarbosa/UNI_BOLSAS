'use client';

import { useState } from 'react';
import type { ProductWithRelations } from '@/lib/queries/products';
import { Gallery } from './Gallery';
import { ProductInfo } from './ProductInfo';
import { PdpBuyBar } from './PdpBuyBar';
import { galleryImages } from '@/lib/product-images';

type PdpContentProps = {
  product: ProductWithRelations;
};

export function PdpContent({ product }: PdpContentProps) {
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);

  const color = product.colors[colorIdx] ?? product.colors[0] ?? null;
  const images = galleryImages(product, color);
  const sizeForWa =
    product.sizes && product.sizes.length > 1
      ? product.sizes[sizeIdx]
      : undefined;

  return (
    <section className="uni-pdp uni-section">
      <div className="uni-container">
        <div className="uni-pdp-grid">
          <Gallery images={images} productName={product.name} />
          <ProductInfo
            product={product}
            colorIdx={colorIdx}
            sizeIdx={sizeIdx}
            onColorChange={(i) => {
              setColorIdx(i);
              setSizeIdx(0);
            }}
            onSizeChange={setSizeIdx}
          />
        </div>
      </div>
      <PdpBuyBar product={product} color={color} size={sizeForWa} />
    </section>
  );
}
