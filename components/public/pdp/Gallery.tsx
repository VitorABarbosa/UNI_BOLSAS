'use client';

import { useEffect, useState } from 'react';
import type { GalleryImage } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';

type GalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function Gallery({ images, productName }: GalleryProps) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setImgIdx(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="uni-pdp-gallery">
        <div className="uni-pdp-gallery-main is-empty">
          <span>Sem imagens disponíveis para {productName}.</span>
        </div>
      </div>
    );
  }

  const safeIdx = Math.min(imgIdx, images.length - 1);
  const main = images[safeIdx]!;

  return (
    <div className="uni-pdp-gallery">
      <div
        className="uni-pdp-gallery-thumbs"
        role="tablist"
        aria-label="Imagens do produto"
      >
        {images.map((img, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={safeIdx === i}
            className={
              'uni-pdp-gallery-thumb ' + (safeIdx === i ? 'is-active' : '')
            }
            onClick={() => setImgIdx(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicImageUrl(img.storage_path)} alt={img.alt} />
          </button>
        ))}
      </div>
      <div className="uni-pdp-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={safeIdx}
          src={publicImageUrl(main.storage_path)}
          alt={main.alt}
        />
      </div>
      <div
        className="uni-pdp-gallery-mobile-swipe"
        role="list"
        aria-label="Imagens do produto (mobile)"
      >
        {images.map((img, i) => (
          <div key={i} className="uni-pdp-gallery-mobile-slide" role="listitem">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicImageUrl(img.storage_path)} alt={img.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
