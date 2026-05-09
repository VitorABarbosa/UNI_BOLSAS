import type { MetadataRoute } from 'next';
import { listProductSlugs } from '@/lib/queries/products';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listProductSlugs();
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
    ...productEntries,
  ];
}
