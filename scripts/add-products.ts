import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

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

type NewColor = {
  name: string;
  hex: string;
  accent_hex?: string;
};

type NewProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category_slug: string;
  badge: string | null;
  price_retail: number;
  price_wholesale: string | null;
  dimensions: string | null;
  weight: string | null;
  material: string | null;
  sizes: string[];
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  colors: NewColor[];
};

// ----- Products to add ------------------------------------------------------
// Append entries here and re-run. The script upserts by `slug`, so running it
// twice is safe: existing products are updated in place, never duplicated.
//
// Images are NOT handled here — upload them in the admin
// (/admin/produtos/[id] -> aba Imagens). Colors are matched by name and never
// deleted, because product_images.color_id cascades on delete and wiping a
// color would take its uploaded photos with it.

const NEW_PRODUCTS: NewProduct[] = [
  {
    slug: 'kit-maison',
    name: 'Kit Maison',
    tagline:
      'Bolsa transversal estruturada com alça de mão, lenço de cetim e carteira combinando.',
    description:
      'Um conjunto que resolve o dia inteiro: bolsa transversal estruturada, ' +
      'carteira combinando e lenço de cetim estampado, todos no mesmo tom. A bolsa ' +
      'tem alça de mão superior para levar na mão e alça transversal removível e ' +
      'ajustável, presa por mosquetões dourados, para usar a tiracolo ou no ombro. ' +
      'A aba frontal fecha em trava dourada, que abre com um toque e segura firme. ' +
      'O couro sintético tem textura granulada e a ferragem dourada acompanha em ' +
      'todos os detalhes, dos mosquetões ao regulador da alça. A carteira tem zíper ' +
      'em volta e vai presa à bolsa ou solta na mão, do tamanho de cartões, dinheiro ' +
      'e celular. O lenço já vem amarrado na alça e pode ser trocado de posição, ou ' +
      'tirado, se você preferir o visual limpo.',
    category_slug: 'kits',
    badge: 'Novidade',
    price_retail: 35.0,
    price_wholesale: null,
    dimensions: null,
    weight: null,
    material: 'PU texturizado · forro têxtil · ferragem dourada · lenço de cetim',
    sizes: ['Único'],
    sort_order: 60,
    seo_title: 'Kit Maison — Bolsa Transversal com Lenço e Carteira | Uni Bolsas',
    seo_description:
      'Bolsa transversal estruturada com alça de mão, lenço de cetim e carteira ' +
      'combinando. Cinco cores, ferragem dourada. Atacado e varejo no Brás.',
    colors: [
      { name: 'Off-White', hex: '#DED2C3' },
      { name: 'Preto',     hex: '#0F0F0F' },
      { name: 'Taupe',     hex: '#857C6B' },
      { name: 'Fendi',     hex: '#A69684' },
      { name: 'Café',      hex: '#4A342A' },
    ],
  },
];

async function main() {
  const supabase = adminClient();

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug');
  if (catError) throw new Error(`failed to read categories: ${catError.message}`);

  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  for (const product of NEW_PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.category_slug);
    if (!categoryId) {
      throw new Error(
        `unknown category slug "${product.category_slug}" — ` +
          `available: ${[...categoryIdBySlug.keys()].join(', ')}`,
      );
    }

    const fields = {
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
      seo_title: product.seo_title,
      seo_description: product.seo_description,
    };

    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', product.slug)
      .maybeSingle();
    if (findError) throw new Error(`lookup failed for ${product.slug}: ${findError.message}`);

    let productId: string;

    if (existing) {
      const { error } = await supabase
        .from('products')
        .update(fields)
        .eq('id', existing.id);
      if (error) throw new Error(`update failed for ${product.slug}: ${error.message}`);
      productId = existing.id;
      console.log(`  ✎ updated ${product.slug}`);
    } else {
      const { data: inserted, error } = await supabase
        .from('products')
        .insert(fields)
        .select('id')
        .single();
      if (error || !inserted) {
        throw new Error(`insert failed for ${product.slug}: ${error?.message}`);
      }
      productId = inserted.id;
      console.log(`  + inserted ${product.slug}`);
    }

    // Colors: match by name so re-runs don't cascade-delete uploaded images.
    const { data: currentColors, error: colorsError } = await supabase
      .from('product_colors')
      .select('id, name')
      .eq('product_id', productId);
    if (colorsError) throw new Error(`failed to read colors: ${colorsError.message}`);

    const colorIdByName = new Map((currentColors ?? []).map((c) => [c.name, c.id]));

    for (const [index, color] of product.colors.entries()) {
      const row = {
        product_id: productId,
        name: color.name,
        hex: color.hex,
        accent_hex: color.accent_hex ?? null,
        sort_order: index,
      };

      const existingColorId = colorIdByName.get(color.name);
      if (existingColorId) {
        const { error } = await supabase
          .from('product_colors')
          .update(row)
          .eq('id', existingColorId);
        if (error) throw new Error(`color update failed (${color.name}): ${error.message}`);
      } else {
        const { error } = await supabase.from('product_colors').insert(row);
        if (error) throw new Error(`color insert failed (${color.name}): ${error.message}`);
      }
    }

    console.log(`    ${product.colors.length} cores sincronizadas`);
  }

  console.log('✅ Produtos sincronizados. Suba as fotos pelo /admin/produtos.');
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
