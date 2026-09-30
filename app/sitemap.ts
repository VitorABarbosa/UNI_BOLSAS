import type { MetadataRoute } from 'next';
import { listProductSlugs, type ProductSlugRow } from '@/lib/queries/products';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Best-effort: if slugs can't be fetched (e.g. build-time generation with
  // no network egress), emit the base sitemap. ISR repopulates it at runtime.
  let slugs: ProductSlugRow[] = [];
  try {
    slugs = await listProductSlugs();
  } catch (err) {
    console.warn('[sitemap] product slugs unavailable, emitting base sitemap:', err);
  }
  const productEntries: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${SITE_URL}/produtos/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      // Não é página de venda, mas precisa ser encontrável: é para onde
      // apontam o aviso de cookies e o rodapé, e é o que um cliente procura
      // quando quer saber o que guardamos sobre ele.
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...productEntries,
  ];
}
