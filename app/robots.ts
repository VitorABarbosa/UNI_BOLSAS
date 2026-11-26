import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Páginas pessoais (conta, pedido, pagamento) e internas: nada a buscar.
        disallow: ['/admin/', '/api/', '/conta/', '/finalizar', '/pedido/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
