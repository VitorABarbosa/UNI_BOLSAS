import { FAQ } from '@/lib/content/faq';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { STORE } from '@/lib/content/store';
import { codigoPeca } from '@/lib/pedido';
import { galleryImages } from '@/lib/product-images';
import { productPrice } from '@/lib/product-price';
import type { ProductWithRelations } from '@/lib/queries/products';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { INSTAGRAM_HANDLE, WHATSAPP_NUMBER } from '@/lib/tokens';
import { truncate } from '@/lib/format';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * Dados estruturados (schema.org) — o que o Google lê pra entender a página
 * sem adivinhar pelo texto.
 *
 * É o que faz a busca por "bolsas atacado Brás" mostrar endereço, horário e
 * telefone da loja, as perguntas frequentes abertas no resultado, e o preço
 * na ficha de cada peça. Tudo sai daqui, dos mesmos dados que a página
 * mostra: se a página muda, isto muda junto.
 */

const LOJA_ID = `${SITE_URL}/#loja`;

/** A loja física. `WholesaleStore` é o tipo de "loja de atacado" do schema.org. */
export function dadosLoja() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WholesaleStore',
    '@id': LOJA_ID,
    name: SITE_NAME,
    description: `Bolsas, mochilas e malas no atacado, a partir de ${PEDIDO_MINIMO} peças, direto do nosso stand no ${STORE.name}, Brás, São Paulo.`,
    url: SITE_URL,
    logo: `${SITE_URL}/LOGO_UNI_BOLSAS_PNG.png`,
    image: [`${SITE_URL}/hero/slide-1.jpg`, `${SITE_URL}/hero/slide-2.jpg`],
    telephone: `+${WHATSAPP_NUMBER}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${STORE.street} — ${STORE.name}`,
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: STORE.cep,
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: STORE.lat, longitude: STORE.lng },
    hasMap: STORE.mapsUrl,
    openingHoursSpecification: STORE.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: { '@type': 'Country', name: 'Brasil' },
    sameAs: [`https://instagram.com/${INSTAGRAM_HANDLE}`],
  };
}

/** O site em si — é daqui que o Google tira o nome que mostra no resultado. */
export function dadosSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@id': LOJA_ID },
  };
}

/** As perguntas da seção "Dúvidas", no formato de FAQ do Google. */
export function dadosPerguntas() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** A ficha de uma peça: nome, fotos, preço e quem vende. */
export function dadosPeca(product: ProductWithRelations) {
  const url = `${SITE_URL}/produtos/${product.slug}`;
  const preco = productPrice(product);
  // Todas as fotos, de todas as cores, sem repetir.
  const fotos = Array.from(
    new Set(
      [null, ...product.colors].flatMap((c) =>
        galleryImages(product, c).map((g) => publicImageUrl(g.storage_path)),
      ),
    ),
  );
  const descricao =
    product.description?.trim() ||
    product.tagline?.trim() ||
    `${product.name} no atacado, a partir de ${PEDIDO_MINIMO} peças.`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncate(descricao, 500),
    url,
    sku: codigoPeca(product.id),
    image: fotos,
    category: product.category?.label,
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(product.material ? { material: product.material } : {}),
    ...(product.colors.length
      ? { color: product.colors.map((c) => c.name).join(', ') }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: preco.current.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', '@id': LOJA_ID, name: SITE_NAME },
    },
  };
}

/** O caminho da peça: Início › Catálogo › peça. */
export function dadosCaminho(product: ProductWithRelations) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalogo` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${SITE_URL}/produtos/${product.slug}`,
      },
    ],
  };
}
