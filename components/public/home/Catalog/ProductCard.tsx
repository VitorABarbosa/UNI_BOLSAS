'use client';

import { useState } from 'react';
import { ArrowIcon, WhatsAppIcon } from '@/components/public/icons';
import type { ProductWithRelations } from '@/lib/queries/products';
import { galleryImages } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { waProduct } from '@/lib/whatsapp';

type ProductCardProps = {
  product: ProductWithRelations;
  selectedColorIdx: number;
  previewColorIdx: number | null;
  onSelectColor: (productId: string, idx: number) => void;
  onPreviewColor: (productId: string, idx: number | null) => void;
  onOpenQuickView: (product: ProductWithRelations, colorIdx: number) => void;
  isLeaving: boolean;
  isEntering: boolean;
};

export function ProductCard({
  product,
  selectedColorIdx,
  previewColorIdx,
  onSelectColor,
  onPreviewColor,
  onOpenQuickView,
  isLeaving,
  isEntering,
}: ProductCardProps) {
  const selected =
    product.colors[selectedColorIdx] ?? product.colors[0] ?? null;
  const previewing =
    previewColorIdx != null ? product.colors[previewColorIdx] : null;
  const activeColor = previewing ?? selected;

  const [imgIdx, setImgIdx] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const activeImages = galleryImages(product, activeColor);
  const baseImg =
    activeImages[Math.min(imgIdx, activeImages.length - 1)] ??
    activeImages[0] ??
    null;

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    setParallax({ x: -cx * 4, y: -cy * 4 });
  };
  const onMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
    setImgIdx(0);
  };

  const selectedImages = galleryImages(product, selected);
  const showDots = selectedImages.length > 1 && !previewing;
  const categorySlug = product.category?.slug ?? 'todos';

  return (
    <article
      className={
        'uni-card ' +
        (isLeaving ? 'is-leaving ' : '') +
        (isEntering ? 'is-entering' : '')
      }
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="uni-card-img-wrap"
        role="button"
        tabIndex={0}
        onClick={() => onOpenQuickView(product, selectedColorIdx)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenQuickView(product, selectedColorIdx);
          }
        }}
        onMouseEnter={() => {
          if (selectedImages.length > 1) setImgIdx(1);
        }}
        aria-label={`Ver detalhes ${product.name} cor ${activeColor?.name ?? ''}`}
      >
        {product.badge && (
          <div className={`uni-card-badge cat-${categorySlug}`}>
            {product.badge}
          </div>
        )}
        {baseImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicImageUrl(baseImg.storage_path)}
            alt={baseImg.alt}
            className="uni-card-img"
            style={{
              transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.02)`,
            }}
          />
        )}
        {showDots && (
          <>
            <button
              type="button"
              className="uni-card-arrow uni-card-arrow-prev"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx(
                  (imgIdx - 1 + selectedImages.length) % selectedImages.length,
                );
              }}
              aria-label="Imagem anterior"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="uni-card-arrow uni-card-arrow-next"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((imgIdx + 1) % selectedImages.length);
              }}
              aria-label="Próxima imagem"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <div className="uni-card-dots" aria-hidden="true">
              {selectedImages.map((_, i) => (
                <span
                  key={i}
                  className="uni-card-dot"
                  style={{
                    width: i === imgIdx ? 18 : 6,
                    opacity: i === imgIdx ? 1 : 0.45,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="uni-card-body">
        <div className="uni-card-head-row">
          <h3 className="uni-card-name">{product.name}</h3>
          <div className="uni-card-price">
            R$ {product.price_retail.toFixed(2).replace('.', ',')}
          </div>
        </div>
        {product.tagline && (
          <p className="uni-card-tagline">{product.tagline}</p>
        )}
        {product.sizes && product.sizes.length > 1 && (
          <div className="uni-card-sizes" aria-label="Tamanhos disponíveis">
            {product.sizes.map((s) => (
              <span key={s} className="uni-card-size-chip">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="uni-card-colors">
          <div className="uni-card-colors-label">
            <span>Cor:</span>
            <strong>{activeColor?.name ?? '—'}</strong>
            <span className="uni-card-colors-count">
              {product.colors.length}{' '}
              {product.colors.length === 1 ? 'cor' : 'cores'}
            </span>
          </div>
          <div className="uni-card-swatches">
            {product.colors.map((c, i) => (
              <button
                key={c.id}
                className={
                  'uni-swatch ' + (selectedColorIdx === i ? 'is-selected' : '')
                }
                style={{
                  background: c.accent_hex
                    ? `linear-gradient(135deg, ${c.hex} 0% 60%, ${c.accent_hex} 60% 100%)`
                    : c.hex,
                }}
                onClick={() => onSelectColor(product.id, i)}
                onMouseEnter={() => onPreviewColor(product.id, i)}
                onMouseLeave={() => onPreviewColor(product.id, null)}
                aria-label={`Cor ${c.name}${selectedColorIdx === i ? ' (selecionada)' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="uni-card-cta-row">
          <button
            className="uni-card-cta-detail"
            onClick={() => onOpenQuickView(product, selectedColorIdx)}
          >
            Ver detalhes <ArrowIcon size={12} />
          </button>
          <a
            className="uni-card-cta-wa"
            href={waProduct(product, selected)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={12} />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
