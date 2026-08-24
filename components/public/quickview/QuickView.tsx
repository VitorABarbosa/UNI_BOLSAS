'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ProductPhoto } from '@/components/public/primitives/ProductPhoto';
import { CloseIcon } from '@/components/public/icons';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import type { ProductWithRelations } from '@/lib/queries/products';
import { galleryImages } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { productPrice } from '@/lib/product-price';
import { waProduct } from '@/lib/whatsapp';

type QuickViewProps = {
  product: ProductWithRelations;
  initialColorIdx: number;
  onClose: () => void;
};

const QV_SIZES = '(max-width: 1080px) 100vw, 700px';

export function QuickView({
  product,
  initialColorIdx,
  onClose,
}: QuickViewProps) {
  const [colorIdx, setColorIdx] = useState(initialColorIdx ?? 0);
  const [imgIdx, setImgIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  /** Evita que o scroll programático (clique na miniatura) vire "swipe". */
  const syncingRef = useRef(false);

  const color = product.colors[colorIdx] ?? product.colors[0] ?? null;
  const images = galleryImages(product, color);
  const price = productPrice(product);

  useEffect(() => {
    setImgIdx(0);
    stageRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [colorIdx]);

  useEffect(() => {
    // Trava o fundo sem perder a posição da rolagem ao fechar (no iOS,
    // `overflow: hidden` sozinho deixa a página voltar pro topo).
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  /** Mantém o índice ativo em sincronia com o swipe do usuário. */
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

  const sizeForWa =
    product.sizes && product.sizes.length > 1
      ? product.sizes[sizeIdx]
      : undefined;

  return (
    <div
      className="uni-qv-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes ${product.name}`}
    >
      <div className="uni-qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="uni-qv-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={16} />
        </button>
        <div className="uni-qv-gallery">
          <div
            className="uni-qv-thumbs"
            role="tablist"
            aria-label="Imagens da galeria"
          >
            {images.map((img, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={imgIdx === i}
                className={'uni-qv-thumb ' + (imgIdx === i ? 'is-active' : '')}
                onClick={() => goToImage(i)}
              >
                <Image
                  src={publicImageUrl(img.storage_path)}
                  alt={`${product.name} ${color?.name ?? ''} #${i + 1}`}
                  fill
                  sizes="80px"
                />
              </button>
            ))}
          </div>
          {/* Um único palco com scroll-snap: arrasta no celular, é clicado pelas
              miniaturas no desktop. Cada foto é baixada uma vez só. */}
          <div
            className="uni-qv-stage"
            ref={stageRef}
            onScroll={onStageScroll}
            aria-live="polite"
          >
            {images.map((img, i) => (
              <div className="uni-qv-slide" key={i}>
                <ProductPhoto
                  src={publicImageUrl(img.storage_path)}
                  alt={img.alt}
                  sizes={QV_SIZES}
                  priority={i === 0}
                />
              </div>
            ))}
            {images.length === 0 && (
              <div className="uni-qv-slide is-empty">
                <span>Sem imagens disponíveis.</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="uni-qv-dots" role="tablist" aria-label="Foto">
              {images.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={imgIdx === i}
                  aria-label={`Foto ${i + 1}`}
                  className={'uni-qv-dot ' + (imgIdx === i ? 'is-active' : '')}
                  onClick={() => goToImage(i)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="uni-qv-info">
          <div className="uni-qv-eyebrow">
            {product.category?.label ?? ''}
            {product.badge ? ' · ' + product.badge : ''}
          </div>
          <h2 className="uni-qv-name">{product.name}</h2>
          <div className="uni-qv-price-row">
            <span className="uni-qv-price">{price.currentLabel}</span>
            {price.originalLabel && (
              <>
                <s className="uni-qv-price-was">{price.originalLabel}</s>
                <span className="uni-qv-price-off">
                  -{price.discountPct}%
                </span>
              </>
            )}
            {product.price_wholesale && (
              <span className="uni-qv-price-w">
                Atacado · {product.price_wholesale}
              </span>
            )}
          </div>
          {product.description && (
            <p className="uni-qv-desc">{product.description}</p>
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
            <div className="uni-qv-swatch-row">
              {product.colors.map((c, i) => (
                <button
                  key={c.id}
                  className={
                    'uni-swatch ' + (colorIdx === i ? 'is-selected' : '')
                  }
                  style={{
                    width: 26,
                    height: 26,
                    background: c.accent_hex
                      ? `linear-gradient(135deg, ${c.hex} 0% 60%, ${c.accent_hex} 60% 100%)`
                      : c.hex,
                  }}
                  onClick={() => setColorIdx(i)}
                  aria-label={`Cor ${c.name}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          {product.sizes && product.sizes.length > 1 && (
            <div className="uni-qv-size-section">
              <div className="uni-qv-section-label">
                Tamanho: <strong>{product.sizes[sizeIdx]}</strong>
              </div>
              <div className="uni-qv-size-row">
                {product.sizes.map((s, i) => (
                  <button
                    key={s}
                    className={
                      'uni-qv-size-chip ' + (sizeIdx === i ? 'is-selected' : '')
                    }
                    onClick={() => setSizeIdx(i)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="uni-qv-cta">
            <WhatsAppButton href={waProduct(product, color, sizeForWa)} full>
              Pedir no WhatsApp · {price.currentLabel}
            </WhatsAppButton>
            <p className="uni-qv-cta-note">
              Atendimento humano · respondemos em até 5min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
