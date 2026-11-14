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
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { JsonLd } from '@/components/public/primitives/JsonLd';
import { dadosCaminho, dadosPeca } from '@/lib/dados-estruturados';

export const revalidate = 60;

export async function generateStaticParams() {
  // Build-time prerender is best-effort: if the data source is unreachable
  // during the build (e.g. no network egress on the CI builder), skip
  // prerendering. `dynamicParams` defaults to true, so each page is still
  // rendered on demand via ISR (revalidate above) on first request.
  try {
    const slugs = await listProductSlugs();
    return slugs.map((s) => ({ slug: s.slug }));
  } catch (err) {
    console.warn(
      '[produtos/[slug]] generateStaticParams: slugs unavailable at build, falling back to on-demand ISR:',
      err,
    );
    return [];
  }
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
  // "no atacado" no título: é a palavra que a lojista digita no Google.
  const title = product.seo_title ?? `${product.name} no atacado — ${SITE_NAME}`;
  const description =
    product.seo_description ??
    truncate(
      product.description?.trim() ||
        product.tagline?.trim() ||
        `${product.name} no atacado, a partir de ${PEDIDO_MINIMO} peças, direto do Brás.`,
      160,
    );
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
      <JsonLd data={[dadosPeca(product), dadosCaminho(product)]} />
      <PdpContent product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
