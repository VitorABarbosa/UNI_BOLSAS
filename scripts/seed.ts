import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import {
  matelasse,
  lartlune,
  mochila,
  fitness,
  sport,
  lifestyle,
} from '@/supabase/seed-assets/images';

// Inline service-role client. We don't use lib/supabase/admin.ts here because
// it imports 'server-only', which throws when loaded by Node scripts (no RSC).
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ----- Categories -----------------------------------------------------------

const CATEGORIES = [
  { slug: 'bolsas',     label: 'Bolsas',     sort_order: 10 },
  { slug: 'kits',       label: 'Kits',       sort_order: 20 },
  { slug: 'mochilas',   label: 'Mochilas',   sort_order: 30 },
  { slug: 'esportivas', label: 'Esportivas', sort_order: 40 },
];

// ----- Product seed data ----------------------------------------------------
// Each `images` is an array of SVG strings (one per photo). Color name + hex
// + accent_hex (bicolor) come from the reference data.jsx.

type SeedColor = {
  name: string;
  hex: string;
  accent_hex?: string;
  images: string[];
};

type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category_slug: string;
  badge: string;
  price_retail: number;
  price_wholesale: string;
  dimensions: string;
  weight: string;
  material: string;
  sizes: string[];
  sort_order: number;
  colors: SeedColor[];
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: 'matelasse-mini',
    name: 'Matelassê Mini',
    tagline: 'Acolchoada com fecho duplo dourado e alça de corrente trançada.',
    description:
      'A clássica do dia a dia, em formato pequeno. Couro sintético matelassê acolchoado, ferragem dourada que não escurece com o tempo, alça de corrente removível e forro têxtil interno com bolso para celular. Cabe carteira, batom, chave e celular grande sem apertar.',
    category_slug: 'bolsas',
    badge: 'Mais vendida',
    price_retail: 89.0,
    price_wholesale: 'A partir de R$ 65 · 10un+',
    dimensions: '22 × 17 × 10 cm',
    weight: '0,275 kg',
    material: 'PU acolchoado · forro têxtil · ferragem dourada',
    sizes: ['Único'],
    sort_order: 10,
    colors: [
      { name: 'Preto',     hex: '#0F0F0F', images: [matelasse('#0F0F0F')] },
      { name: 'Caramelo',  hex: '#A47551', images: [matelasse('#A47551')] },
      { name: 'Vinho',     hex: '#5C1A2B', images: [matelasse('#5C1A2B')] },
      { name: 'Off-White', hex: '#EFE9DC', images: [matelasse('#EFE9DC')] },
      { name: 'Nude',      hex: '#C9A98C', images: [matelasse('#C9A98C')] },
    ],
  },
  {
    slug: 'lartlune-kit',
    name: "Kit L'ART&LUNE",
    tagline: 'Bolsa transversal estruturada + carteira combinando · alça superior.',
    description:
      'Combo prático: bolsa transversal com estrutura firme e carteira combinando, no mesmo material. Bolsa traz alça superior fixa e alça transversal removível; carteira tem 6 espaços de cartão, dois compartimentos para cédulas e zíper interno. Pra quem gosta de conjunto sem combinar.',
    category_slug: 'kits',
    badge: 'Combo',
    price_retail: 149.0,
    price_wholesale: 'A partir de R$ 110 · 6un+',
    dimensions: 'Bolsa 25 × 19 × 8 cm · Carteira 19 × 10 cm',
    weight: '0,520 kg (kit)',
    material: 'PU estruturado · forro têxtil · ferragem dourada escovada',
    sizes: ['Único'],
    sort_order: 20,
    colors: [
      { name: 'Caramelo',    hex: '#A47551', images: [lartlune('#A47551')] },
      { name: 'Off-White',   hex: '#EFE9DC', images: [lartlune('#EFE9DC')] },
      { name: 'Preto',       hex: '#0F0F0F', images: [lartlune('#0F0F0F')] },
      { name: 'Marinho',     hex: '#1A2B4A', images: [lartlune('#1A2B4A')] },
      { name: 'Rosa',        hex: '#E5B5B0', images: [lartlune('#E5B5B0')] },
      { name: 'Cinza Taupe', hex: '#8C7E72', images: [lartlune('#8C7E72')] },
    ],
  },
  {
    slug: 'mochila-mini-bicolor',
    name: 'Mochila Mini Bicolor',
    tagline: 'Mochila compacta com vivo contrastante · 22 × 27 cm.',
    description:
      'Mochila pequena de alça larga, ideal pra escola, faculdade e dia a dia. Vivo bicolor que destaca o bolso da frente, dois bolsos internos, compartimento principal com zíper duplo e tira de mão superior. Volta às aulas com a gente.',
    category_slug: 'mochilas',
    badge: 'Volta às aulas',
    price_retail: 79.0,
    price_wholesale: 'A partir de R$ 59 · 10un+',
    dimensions: '22 × 27 × 11 cm',
    weight: '0,340 kg',
    material: 'Nylon resinado · forro impermeável · alças acolchoadas',
    sizes: ['Único'],
    sort_order: 30,
    colors: [
      {
        name: 'Preto / Branco',
        hex: '#0F0F0F',
        accent_hex: '#FFFFFF',
        images: [mochila('#0F0F0F', '#FFFFFF'), lifestyle('#0F0F0F', 'Mini Bicolor')],
      },
      { name: 'Marinho / Branco', hex: '#1A2B4A', accent_hex: '#FFFFFF', images: [mochila('#1A2B4A', '#FFFFFF')] },
      { name: 'Cinza / Branco',   hex: '#7A7C80', accent_hex: '#FFFFFF', images: [mochila('#7A7C80', '#FFFFFF')] },
      { name: 'Preto / Pink',     hex: '#0F0F0F', accent_hex: '#FF1493', images: [mochila('#0F0F0F', '#FF1493')] },
      { name: 'Marinho / Pink',   hex: '#1A2B4A', accent_hex: '#FF1493', images: [mochila('#1A2B4A', '#FF1493')] },
    ],
  },
  {
    slug: 'fitness',
    name: 'Bolsa Fitness',
    tagline: 'Mala esportiva fluída · ideal pra academia · 39 × 27 cm.',
    description:
      'Bolsa de academia com bolso lateral para tênis, divisória interna úmido/seco, alça de mão e alça transversal ajustável. Tecido resistente a respingo, fundo reforçado, pega o que precisar pro treino sem deformar.',
    category_slug: 'esportivas',
    badge: 'Promoção',
    price_retail: 65.0,
    price_wholesale: 'A partir de R$ 49 · 12un+',
    dimensions: '39 × 27 × 22 cm',
    weight: '0,420 kg',
    material: 'Poliéster 600D · forro impermeável · zíper YKK',
    sizes: ['P', 'M', 'G'],
    sort_order: 40,
    colors: [
      { name: 'Grafite',  hex: '#3A3D40', images: [fitness('#3A3D40')] },
      { name: 'Vermelho', hex: '#A82238', images: [fitness('#A82238')] },
      { name: 'Pink',     hex: '#C73C7E', images: [fitness('#C73C7E')] },
      { name: 'Marinho',  hex: '#1A2B4A', images: [fitness('#1A2B4A')] },
      { name: 'Preto',    hex: '#0F0F0F', images: [fitness('#0F0F0F')] },
    ],
  },
  {
    slug: 'sport',
    name: 'Mala Sport',
    tagline: 'Mala esportiva clássica · estrutura reforçada · 60 × 30 cm.',
    description:
      'Mala de viagem curta ou esporte, com estrutura reforçada nas laterais, bolso externo grande, alças de mão com pega acolchoada e alça transversal removível. Disponível em P, M, G, GG e Extra G — escolhe o tamanho conforme a sua bagagem.',
    category_slug: 'esportivas',
    badge: 'Novidade',
    price_retail: 119.0,
    price_wholesale: 'A partir de R$ 89 · 10un+',
    dimensions: '60 × 30 × 28 cm (G) · variações P-Extra G',
    weight: '0,780 kg (G)',
    material: 'Poliéster reforçado · base PVC · zíper duplo',
    sizes: ['P', 'M', 'G', 'GG', 'Extra G'],
    sort_order: 50,
    colors: [
      { name: 'Preto',   hex: '#0F0F0F', images: [sport('#0F0F0F'), sport('#0F0F0F', true)] },
      { name: 'Marinho', hex: '#1A2B4A', images: [sport('#1A2B4A'), sport('#1A2B4A', true)] },
    ],
  },
];

// ----- Run ------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding Uni Bolsas catalog...');

  const supabase = adminClient();
  const NEVER = '00000000-0000-0000-0000-000000000000';

  // ---- Wipe previous seed (order matters: children -> parents) -----------
  console.log('  cleaning previous seed...');
  for (const table of ['product_images', 'product_colors', 'products', 'categories'] as const) {
    const { error } = await supabase.from(table).delete().neq('id', NEVER);
    if (error) throw new Error(`failed to wipe ${table}: ${error.message}`);
  }

  // wipe storage by listing recursively then removing in chunks
  const { data: rootEntries } = await supabase.storage.from('products').list('', { limit: 1000 });
  const allPaths: string[] = [];
  if (rootEntries) {
    for (const entry of rootEntries) {
      // entries are folders (one per product_id); list inside
      const { data: inner } = await supabase.storage
        .from('products')
        .list(entry.name, { limit: 1000 });
      if (inner) {
        for (const f of inner) {
          allPaths.push(`${entry.name}/${f.name}`);
        }
      }
    }
  }
  if (allPaths.length > 0) {
    const { error } = await supabase.storage.from('products').remove(allPaths);
    if (error) throw new Error(`failed to wipe storage: ${error.message}`);
  }

  // ---- Insert categories -------------------------------------------------
  console.log('  inserting categories...');
  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .insert(CATEGORIES)
    .select('id, slug');
  if (catError || !insertedCategories) throw new Error(`categories insert failed: ${catError?.message}`);

  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // ---- Insert products + colors + images + storage uploads ---------------
  for (const product of PRODUCTS) {
    console.log(`  inserting product ${product.slug}...`);
    const categoryId = categoryIdBySlug.get(product.category_slug);
    if (!categoryId) throw new Error(`unknown category slug: ${product.category_slug}`);

    const { data: insertedProduct, error: prodError } = await supabase
      .from('products')
      .insert({
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        category_id: categoryId,
        badge: product.badge,
        price_retail: product.price_retail,
        price_wholesale: product.price_wholesale,
        dimensions: product.dimensions,
        weight: product.weight,
        material: product.material,
        sizes: product.sizes,
        sort_order: product.sort_order,
      })
      .select('id')
      .single();
    if (prodError || !insertedProduct) throw new Error(`product insert failed: ${prodError?.message}`);

    const productId = insertedProduct.id;

    for (const [colorIndex, color] of product.colors.entries()) {
      const { data: insertedColor, error: colorError } = await supabase
        .from('product_colors')
        .insert({
          product_id: productId,
          name: color.name,
          hex: color.hex,
          accent_hex: color.accent_hex ?? null,
          sort_order: colorIndex,
        })
        .select('id')
        .single();
      if (colorError || !insertedColor) throw new Error(`color insert failed: ${colorError?.message}`);

      for (const [imageIndex, svg] of color.images.entries()) {
        const fileId = randomUUID();
        const storagePath = `${productId}/${fileId}.svg`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(storagePath, new Blob([svg], { type: 'image/svg+xml' }), {
            contentType: 'image/svg+xml',
            upsert: false,
          });
        if (uploadError) throw new Error(`upload failed for ${storagePath}: ${uploadError.message}`);

        const altSuffix = color.images.length > 1 ? ` · variação ${imageIndex + 1}` : '';
        const { error: imgError } = await supabase.from('product_images').insert({
          product_id: productId,
          color_id: insertedColor.id,
          storage_path: storagePath,
          alt: `${product.name} ${color.name}${altSuffix}`,
          sort_order: imageIndex,
        });
        if (imgError) throw new Error(`image row insert failed: ${imgError.message}`);
      }
    }
  }

  console.log('✅ Seed complete.');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
