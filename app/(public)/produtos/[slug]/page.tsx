import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getProductBySlug,
  listProductSlugs,
  listRelatedProducts,
} from '@/lib/queries/products';
import { PdpContent } from '@/components/public/pdp/PdpContent';
import { RelatedProducts } from '@/components/public/pdp/RelatedProducts';
import { truncate } from '@/lib/format';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.seo_title ?? `${product.name} — ${SITE_NAME}`;
  const description =
    product.seo_description ??
    truncate(product.description ?? product.tagline ?? '', 160);
  const url = `${SITE_URL}/produtos/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: `/produtos/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(
    product.id,
    product.category_id,
    4,
  );
  return (
    <>
      <PdpContent product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
