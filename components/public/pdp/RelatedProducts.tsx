import Image from 'next/image';
import type { ProductWithRelations } from '@/lib/queries/products';
import { cardCoverImage } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { formatPriceBRL } from '@/lib/format';

type RelatedProductsProps = {
  products: ProductWithRelations[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;
  return (
    <section
      className="uni-pdp-related uni-section"
      aria-label="Produtos relacionados"
    >
      <div className="uni-container">
        <div className="uni-section-head">
          <div className="uni-eyebrow uni-eyebrow-wide">Também em estoque</div>
          <h2 className="uni-h2">
            Combine com <em>outras peças</em>.
          </h2>
        </div>
        <div className="uni-pdp-related-grid">
          {products.map((p) => {
            const cover = cardCoverImage(p, p.colors[0] ?? null);
            return (
              <a
                key={p.id}
                href={`/produtos/${p.slug}`}
                className="uni-pdp-related-card"
              >
                <div className="uni-pdp-related-img-wrap">
                  {cover ? (
                    <Image
                      src={publicImageUrl(cover.storage_path)}
                      alt={cover.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 260px"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="uni-pdp-related-name">{p.name}</div>
                <div className="uni-pdp-related-price">
                  {formatPriceBRL(p.price_retail)}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
