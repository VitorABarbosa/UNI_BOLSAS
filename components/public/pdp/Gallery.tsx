'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';

type GalleryProps = {
  images: GalleryImage[];
  productName: string;
};

const PDP_SIZES = '(max-width: 768px) 100vw, 640px';

/**
 * Galeria do produto.
 *
 * Um único "palco" com scroll-snap serve os dois layouts: no desktop as
 * miniaturas laterais rolam o palco; no mobile ele vira carrossel de swipe com
 * pontinhos. Antes existiam três blocos com a mesma lista de fotos (miniaturas,
 * foto grande e faixa mobile) — e o navegador baixava todas as versões mesmo
 * com `display: none`, triplicando o tráfego no celular.
 */
export function Gallery({ images, productName }: GalleryProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    setImgIdx(0);
    stageRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="uni-pdp-gallery">
        <div className="uni-pdp-stage is-empty">
          <span>Sem imagens disponíveis para {productName}.</span>
        </div>
      </div>
    );
  }

  const onStageScroll = () => {
    const el = stageRef.current;
    if (!el || syncingRef.current || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setImgIdx((current) => (current === idx ? current : idx));
  };

  const goToImage = (i: number) => {
    setImgIdx(i);
    const el = stageRef.current;
    if (!el) return;
    syncingRef.current = true;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, 450);
  };

  const safeIdx = Math.min(imgIdx, images.length - 1);

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
            onClick={() => goToImage(i)}
          >
            <Image
              src={publicImageUrl(img.storage_path)}
              alt={img.alt}
              fill
              sizes="84px"
            />
          </button>
        ))}
      </div>
      <div
        className="uni-pdp-stage"
        ref={stageRef}
        onScroll={onStageScroll}
        role="list"
        aria-label="Fotos do produto"
      >
        {images.map((img, i) => (
          <div className="uni-pdp-slide" key={i} role="listitem">
            <Image
              src={publicImageUrl(img.storage_path)}
              alt={img.alt}
              fill
              sizes={PDP_SIZES}
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="uni-pdp-dots" role="tablist" aria-label="Foto">
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={safeIdx === i}
              aria-label={`Foto ${i + 1}`}
              className={'uni-pdp-dot ' + (safeIdx === i ? 'is-active' : '')}
              onClick={() => goToImage(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
