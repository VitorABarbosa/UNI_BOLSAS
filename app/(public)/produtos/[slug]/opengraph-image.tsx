import { ImageResponse } from 'next/og';
import { getProductBySlug } from '@/lib/queries/products';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { cardCoverImage } from '@/lib/product-images';
import { formatPriceBRL } from '@/lib/format';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: '#F4EFE6',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: '#111',
          }}
        >
          Produto não encontrado
        </div>
      ),
      size,
    );
  }

  const cover = cardCoverImage(product, product.colors[0] ?? null);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#F4EFE6',
        }}
      >
        {cover && (
          /* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */
          <img
            src={publicImageUrl(cover.storage_path)}
            width={500}
            height={630}
            style={{ objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 60,
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: '#6B4326',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            UNI BOLSAS · BRÁS · SP
          </div>
          <div
            style={{
              fontSize: 64,
              fontStyle: 'italic',
              color: '#111',
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {product.name}
          </div>
          <div
            style={{ fontSize: 24, color: '#6E665C', marginBottom: 40 }}
          >
            {product.tagline ?? ''}
          </div>
          <div style={{ fontSize: 36, color: '#111' }}>
            {formatPriceBRL(product.price_retail)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
