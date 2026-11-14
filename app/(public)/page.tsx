import type { Metadata } from 'next';
import { Hero } from '@/components/public/home/Hero';
import { CredibilityStrip } from '@/components/public/home/CredibilityStrip';
import { ComoComprar } from '@/components/public/home/ComoComprar';
import { Reels } from '@/components/public/home/Reels';
import { Social } from '@/components/public/home/Social';
import { FAQSection } from '@/components/public/home/FAQSection';
import { Location } from '@/components/public/home/Location';
import { Newsletter } from '@/components/public/home/Newsletter';
import { HomeContent } from '@/components/public/home/HomeContent';
import { listActiveProducts, listFeaturedProducts } from '@/lib/queries/products';
import { listCategories } from '@/lib/queries/categories';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${SITE_NAME} — Bolsas no atacado · Brás SP`,
  description:
    'Bolsas, mochilas e malas no atacado, a partir de 3 peças, direto do nosso stand no Shopping 900, Brás · São Paulo. Pedido pelo WhatsApp.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Bolsas no atacado · Brás SP`,
    description:
      'Bolsas, mochilas e malas no atacado, a partir de 3 peças, direto do Shopping 900, Brás · SP.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function HomePage() {
  const [products, featured, categoriesFromDb] = await Promise.all([
    listActiveProducts(),
    listFeaturedProducts(),
    listCategories(),
  ]);
  const categoriesWithTodos = [
    { id: 'todos', label: 'Todos' },
    ...categoriesFromDb.map((c) => ({ id: c.slug, label: c.label })),
  ];

  return (
    <>
      <Hero />
      {/* O catálogo vem logo depois do hero: é o que a pessoa veio ver. */}
      <HomeContent
        products={products}
        featured={featured}
        categories={categoriesWithTodos}
      />
      <ComoComprar />
      <CredibilityStrip />
      <Reels />
      <Social />
      <FAQSection />
      <Location />
      <Newsletter />
    </>
  );
}
