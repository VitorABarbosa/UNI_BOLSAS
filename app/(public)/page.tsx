import type { Metadata } from 'next';
import { Hero } from '@/components/public/home/Hero';
import { CredibilityStrip } from '@/components/public/home/CredibilityStrip';
import { ComoComprar } from '@/components/public/home/ComoComprar';
import { Reels } from '@/components/public/home/Reels';
import { FAQSection } from '@/components/public/home/FAQSection';
import { Location } from '@/components/public/home/Location';
import { Newsletter } from '@/components/public/home/Newsletter';
import { HomeContent } from '@/components/public/home/HomeContent';
import { Lookbook, type LookDaVitrine } from '@/components/public/home/Lookbook';
import { LOOKS } from '@/lib/content/lookbook';
import { listActiveProducts, listFeaturedProducts } from '@/lib/queries/products';
import { listCategories } from '@/lib/queries/categories';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { novidadesIds } from '@/lib/novidades';
import { DESCRICAO_INICIO, PALAVRAS_CHAVE, TITULO_INICIO } from '@/lib/content/vitrine';
import { JsonLd } from '@/components/public/primitives/JsonLd';
import {
  dadosLoja,
  dadosPerguntas,
  dadosSite,
} from '@/lib/dados-estruturados';

export const revalidate = 60;

export const metadata: Metadata = {
  title: TITULO_INICIO,
  description: DESCRICAO_INICIO,
  keywords: PALAVRAS_CHAVE,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITULO_INICIO,
    description: DESCRICAO_INICIO,
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

  // Lookbook: só os looks cuja bolsa está à venda agora.
  const porId = new Map(products.map((p) => [p.id, p]));
  const looks: LookDaVitrine[] = LOOKS.flatMap((cfg) => {
    const product = porId.get(cfg.produtoId);
    return product ? [{ cfg, product }] : [];
  });

  return (
    <>
      <JsonLd data={[dadosLoja(), dadosSite(), dadosPerguntas()]} />
      <Hero />
      {/* O catálogo vem logo depois do hero: é o que a pessoa veio ver. */}
      <HomeContent
        products={products}
        featured={featured}
        categories={categoriesWithTodos}
        newIds={novidadesIds(products)}
        lookbook={looks}
      />
      <Lookbook looks={looks} />
      <ComoComprar />
      <CredibilityStrip />
      <Reels />
      <FAQSection />
      <Location />
      <Newsletter />
    </>
  );
}
