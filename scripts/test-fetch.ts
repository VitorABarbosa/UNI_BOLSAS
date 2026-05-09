import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  // Use the anon key on purpose: this exercises the public read RLS policy,
  // not the service-role bypass. If it works, the same SDK call will work
  // from the browser and from RSC.
  const supabase = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, name, price_retail, active, sort_order,
       category:categories(slug, label),
       colors:product_colors(id, name, hex, accent_hex, sort_order),
       images:product_images(id, color_id, storage_path, sort_order)`,
    )
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  if (!data) throw new Error('no data returned');

  console.log(`✅ Fetched ${data.length} products via anon key:\n`);
  for (const p of data) {
    const cat = p.category?.slug ?? '?';
    const price = `R$ ${p.price_retail.toFixed(2).replace('.', ',')}`;
    console.log(
      `  · ${p.name.padEnd(22)} ${price.padEnd(11)} [${cat.padEnd(10)}]  ` +
        `${p.colors.length} cores · ${p.images.length} imagens`,
    );
  }

  if (data.length === 0) {
    console.error('\n❌ Smoke test FAILED: zero products returned.');
    process.exit(1);
  }

  console.log('\n✅ Smoke test passed.');
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
