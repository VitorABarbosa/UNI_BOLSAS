'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ProductWithRelations } from '@/lib/queries/products';
import { Gallery } from './Gallery';
import { ProductInfo } from './ProductInfo';
import { PdpBuyBar } from './PdpBuyBar';
import { cardCoverImage, galleryImages } from '@/lib/product-images';

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
        {/* Quem chega pelo link do WhatsApp cai direto aqui, sem ter passado
            pelo catálogo — este é o caminho de volta pra ver o resto. */}
        <nav className="uni-pdp-crumb" aria-label="Você está em">
          <Link href="/#catalogo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            Catálogo
          </Link>
          {product.category?.label && (
            <span aria-current="page">{product.category.label}</span>
          )}
        </nav>
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
      <PdpBuyBar
        product={product}
        color={color}
        size={sizeForWa}
        image={cardCoverImage(product, color)?.storage_path ?? null}
      />
    </section>
  );
}
