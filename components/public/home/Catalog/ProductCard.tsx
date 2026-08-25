'use client';

import { useState } from 'react';
import { ArrowIcon, WhatsAppIcon } from '@/components/public/icons';
import { ProductPhoto } from '@/components/public/primitives/ProductPhoto';
import type { ProductWithRelations } from '@/lib/queries/products';
import { cardCoverImage, galleryImages } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { productPrice } from '@/lib/product-price';
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

/**
 * Larguras REAIS do card por breakpoint. Este valor precisa bater com o que o
 * CSS realmente renderiza: o navegador escolhe a variante da foto a partir
 * daqui, e um número menor que a realidade faz a imagem chegar pequena e ser
 * esticada — que era o motivo das bolsas aparecerem borradas no desktop.
 *
 *   ≤600px   grid de 2 colunas, container 20px, gap 10-14px → ~48vw
 *   ≤1080px  grid de 2 colunas, container 24px, gap 24px    → ~47vw
 *   acima    grid de 2 colunas com max-width 1100 e gap 36  → (1100-36)/2 = 532px
 */
const CARD_SIZES =
  '(max-width: 600px) 48vw, (max-width: 1080px) 47vw, 540px';

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
  const activeColorIdx = previewColorIdx ?? selectedColorIdx;

  /**
   * Uma camada por cor, todas montadas e sobrepostas.
   *
   * Antes só a cor ativa existia no DOM: trocar de cor trocava o `src` e a
   * foto nova só então começava a baixar — daí a demora até a imagem
   * aparecer. Agora a troca é só opacidade, e é instantânea. As camadas
   * inativas ficam em `loading="lazy"` com prioridade baixa, então o
   * navegador só busca as cores dos cards que chegaram perto da tela.
   */
  const layers = product.colors.length
    ? product.colors.map((color, i) => {
        const images = galleryImages(product, color);
        // Só a cor ativa acompanha a troca de foto do hover (desktop).
        const img =
          i === activeColorIdx
            ? images[Math.min(imgIdx, images.length - 1)] ?? images[0]
            : cardCoverImage(product, color);
        return { key: color.id, img };
      })
    : // Produto sem cor cadastrada (comum nos anúncios importados da Shopee)
      // ainda tem fotos genéricas — sem este ramo o card ficava vazio.
      [
        {
          key: 'sem-cor',
          img:
            activeImages[Math.min(imgIdx, activeImages.length - 1)] ??
            activeImages[0] ??
            null,
        },
      ];
  const hasAnyImage = layers.some((l) => l.img != null);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    // Ponteiro grosso (dedo) não tem parallax — só gastaria render no mobile.
    if (!window.matchMedia('(hover: hover)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    setParallax({ x: -cx * 4, y: -cy * 4 });
  };
  const onMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
    setImgIdx(0);
  };

  const price = productPrice(product);
  const selectedImages = galleryImages(product, selected);
  const showArrows = product.colors.length > 1 && !previewing;
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
        {/* O selo de desconto tem prioridade sobre o badge editorial: é o que
            muda a decisão de quem está passando o olho pelo grid. */}
        {price.isPromo ? (
          <div className="uni-card-badge is-promo">-{price.discountPct}%</div>
        ) : (
          product.badge && (
            <div className={`uni-card-badge cat-${categorySlug}`}>
              {product.badge}
            </div>
          )
        )}
        {hasAnyImage &&
          layers.map(({ key, img }, i) =>
            img ? (
              <div
                key={key}
                className={
                  'uni-card-photo-layer ' +
                  (i === activeColorIdx ? 'is-active' : '')
                }
                aria-hidden={i !== activeColorIdx}
              >
                <ProductPhoto
                  src={publicImageUrl(img.storage_path)}
                  alt={i === activeColorIdx ? img.alt : ''}
                  className="uni-card-img"
                  sizes={CARD_SIZES}
                  // O catálogo nunca é a primeira dobra: tudo entra sob demanda.
                  loading="lazy"
                  fetchPriority={i === activeColorIdx ? 'auto' : 'low'}
                  style={{
                    transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.02)`,
                  }}
                />
              </div>
            ) : null,
          )}
        {!hasAnyImage && (
          <div className="uni-card-noimg">
            <span>Foto em breve</span>
          </div>
        )}
        {showArrows && (
          <>
            <button
              type="button"
              className="uni-card-arrow uni-card-arrow-prev"
              onClick={(e) => {
                e.stopPropagation();
                const next =
                  (selectedColorIdx - 1 + product.colors.length) %
                  product.colors.length;
                setImgIdx(0);
                onSelectColor(product.id, next);
              }}
              aria-label="Cor anterior"
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
                const next = (selectedColorIdx + 1) % product.colors.length;
                setImgIdx(0);
                onSelectColor(product.id, next);
              }}
              aria-label="Próxima cor"
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
              {product.colors.map((_, i) => (
                <span
                  key={i}
                  className="uni-card-dot"
                  style={{
                    width: i === selectedColorIdx ? 18 : 6,
                    opacity: i === selectedColorIdx ? 1 : 0.45,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="uni-card-body">
        <div className="uni-card-head-row">
          {/* Títulos vindos da Shopee são longos ("Bolsa Feminina Transversal
              Couro PU Alça Ajustável..."); o CSS corta em 2 linhas para o
              preço nunca ser empurrado pra fora do card. O nome completo
              continua no quick view e na página do produto. */}
          <h3 className="uni-card-name" title={product.name}>
            {product.name}
          </h3>
          <div className="uni-card-price">
            {price.currentLabel}
            {price.originalLabel && (
              <s className="uni-card-price-was">{price.originalLabel}</s>
            )}
          </div>
          {product.price_wholesale && (
            <div className="uni-card-price-wholesale">
              Atacado · {product.price_wholesale}
            </div>
          )}
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
        {product.colors.length > 0 && (
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
        )}
        <div className="uni-card-cta-row">
          <button
            className="uni-card-cta-detail"
            onClick={() => onOpenQuickView(product, selectedColorIdx)}
            aria-label={`Ver detalhes de ${product.name}`}
          >
            {/* No mobile fica só a seta: um quadrado de 44px ao lado do CTA. */}
            <span className="uni-card-cta-label">Ver detalhes</span>{' '}
            <ArrowIcon size={12} />
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
