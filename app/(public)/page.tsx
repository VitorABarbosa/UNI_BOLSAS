import type { Metadata } from 'next';
import { Hero } from '@/components/public/home/Hero';
import { CredibilityStrip } from '@/components/public/home/CredibilityStrip';
import { WholesaleVsRetail } from '@/components/public/home/WholesaleVsRetail';
import { Reels } from '@/components/public/home/Reels';
import { Social } from '@/components/public/home/Social';
import { FAQSection } from '@/components/public/home/FAQSection';
import { Location } from '@/components/public/home/Location';
import { Newsletter } from '@/components/public/home/Newsletter';
import { HomeContent } from '@/components/public/home/HomeContent';
import { listActiveProducts } from '@/lib/queries/products';
import { listCategories } from '@/lib/queries/categories';
import { HERO_SLIDES } from '@/lib/content/hero-slides';
import { getVimeoPosterUrl } from '@/lib/vimeo';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${SITE_NAME} — Atacado e Varejo · Brás SP`,
  description:
    'Catálogo curado de bolsas, mochilas e malas direto do nosso stand no Shopping 900, Brás · São Paulo. Atendimento atacado e varejo via WhatsApp.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Atacado e Varejo · Brás SP`,
    description:
      'Catálogo curado de bolsas, mochilas e malas direto do nosso stand no Shopping 900, Brás · SP.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function HomePage() {
  const [products, categoriesFromDb, heroPosterEntries] = await Promise.all([
    listActiveProducts(),
    listCategories(),
    // Poster de cada slide de vídeo do hero: resolvido aqui no servidor pra
    // já sair no HTML inicial cobrindo o player enquanto ele carrega.
    Promise.all(
      HERO_SLIDES.filter((s) => s.vimeoId != null).map(
        async (s) => [s.key, await getVimeoPosterUrl(s.vimeoId!)] as const,
      ),
    ),
  ]);
  const categoriesWithTodos = [
    { id: 'todos', label: 'Todos' },
    ...categoriesFromDb.map((c) => ({ id: c.slug, label: c.label })),
  ];
  const heroPosters = Object.fromEntries(
    heroPosterEntries.filter(
      (entry): entry is readonly [string, string] => entry[1] != null,
    ),
  );

  return (
    <>
      <Hero videoPosters={heroPosters} />
      {/* O catálogo vem logo depois do hero: é o que a pessoa veio ver. */}
      <HomeContent
        products={products}
        categories={categoriesWithTodos}
      />
      <WholesaleVsRetail />
      <CredibilityStrip />
      <Reels />
      <Social />
      <FAQSection />
      <Location />
      <Newsletter />
    </>
  );
}
