'use client';

import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/public/icons';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import type { ProductWithRelations } from '@/lib/queries/products';
import { galleryImages } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { TOKENS } from '@/lib/tokens';
import { waProduct } from '@/lib/whatsapp';

type QuickViewProps = {
  product: ProductWithRelations;
  initialColorIdx: number;
  onClose: () => void;
};

export function QuickView({
  product,
  initialColorIdx,
  onClose,
}: QuickViewProps) {
  const [colorIdx, setColorIdx] = useState(initialColorIdx ?? 0);
  const [imgIdx, setImgIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);

  const color = product.colors[colorIdx] ?? product.colors[0] ?? null;
  const images = galleryImages(product, color);
  const mainImage = images[Math.min(imgIdx, images.length - 1)] ?? images[0];

  useEffect(() => {
    setImgIdx(0);
  }, [colorIdx]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const placeholderStyle = {
    opacity: 0.4,
    cursor: 'default',
    background: `repeating-linear-gradient(45deg, ${TOKENS.whisper}, ${TOKENS.whisper} 4px, ${TOKENS.boneLight} 4px, ${TOKENS.boneLight} 8px)`,
  } as const;

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
        <button
          className="uni-qv-close"
          onClick={onClose}
          aria-label="Fechar"
        >
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
                onClick={() => setImgIdx(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicImageUrl(img.storage_path)}
                  alt={`${product.name} ${color?.name ?? ''} #${i + 1}`}
                />
              </button>
            ))}
            {images.length === 1 &&
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={'ph' + i}
                  className="uni-qv-thumb"
                  style={placeholderStyle}
                />
              ))}
          </div>
          <div className="uni-qv-main">
            {mainImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={imgIdx}
                src={publicImageUrl(mainImage.storage_path)}
                alt={mainImage.alt}
              />
            )}
          </div>
        </div>
        <div className="uni-qv-info">
          <div className="uni-qv-eyebrow">
            {product.category?.label ?? ''}
            {product.badge ? ' · ' + product.badge : ''}
          </div>
          <h2 className="uni-qv-name">{product.name}</h2>
          <div className="uni-qv-price-row">
            <span className="uni-qv-price">
              R$ {product.price_retail.toFixed(2).replace('.', ',')}
            </span>
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
            <WhatsAppButton
              href={waProduct(product, color, sizeForWa)}
              full
            >
              Pedir no WhatsApp · R${' '}
              {product.price_retail.toFixed(2).replace('.', ',')}
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
