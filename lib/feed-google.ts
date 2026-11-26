import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { codigoPeca } from '@/lib/pedido';
import { galleryImages } from '@/lib/product-images';
import { productPrice } from '@/lib/product-price';
import type { ProductWithRelations } from '@/lib/queries/products';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * Feed de produtos para o Google Merchant Center (listagens gratuitas na aba
 * Shopping e no Google Imagens). Formato RSS 2.0 com os campos `g:` que o
 * Google pede. O Merchant Center busca este endereço sozinho, todo dia:
 *   https://unibolsas.store/feed/google.xml
 */

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Caracteres de controle quebram o XML.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const preco = (v: number) => `${v.toFixed(2)} BRL`;

/** Categoria na lista oficial do Google, pelo nome da categoria do catálogo. */
export function categoriaGoogle(categoria: string): string {
  const c = categoria.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (c.includes('mochila')) return 'Luggage & Bags > Backpacks';
  if (c.includes('mala')) return 'Luggage & Bags > Suitcases';
  if (c.includes('esport')) return 'Luggage & Bags > Duffel Bags';
  return 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags';
}

function item(p: ProductWithRelations): string | null {
  const fotos = Array.from(
    new Set([null, ...p.colors].flatMap((c) => galleryImages(p, c).map((g) => publicImageUrl(g.storage_path)))),
  );
  if (!fotos.length) return null; // o Google recusa produto sem foto
  const valor = productPrice(p);
  const categoria = p.category?.label ?? 'Bolsas';
  const descricao =
    `${(p.description?.trim() || p.tagline?.trim() || p.name).slice(0, 4500)}\n\n` +
    `Venda no atacado: pedido mínimo de ${PEDIDO_MINIMO} peças, podendo misturar modelos e cores. ` +
    'Compra pelo site com Pix, cartão ou boleto e envio para todo o Brasil com nota fiscal.';
  const cores = p.colors.map((c) => c.name).slice(0, 3);
  const campos: [string, string][] = [
    ['g:id', codigoPeca(p.id)],
    ['g:title', p.name.slice(0, 150)],
    ['g:description', descricao],
    ['g:link', `${SITE_URL}/produtos/${p.slug}`],
    ['g:image_link', fotos[0]!],
    ...fotos.slice(1, 11).map((f) => ['g:additional_image_link', f] as [string, string]),
    ['g:availability', 'in_stock'],
    ['g:condition', 'new'],
    ['g:brand', SITE_NAME],
    ['g:identifier_exists', 'no'],
    ['g:google_product_category', categoriaGoogle(categoria)],
    ['g:product_type', `${categoria}`],
    ...(valor.isPromo && valor.original
      ? ([
          ['g:price', preco(valor.original)],
          ['g:sale_price', preco(valor.current)],
        ] as [string, string][])
      : ([['g:price', preco(valor.current)]] as [string, string][])),
    ...(cores.length ? ([['g:color', cores.join('/')]] as [string, string][]) : []),
    ...(p.material ? ([['g:material', p.material.slice(0, 200)]] as [string, string][]) : []),
  ];
  return `    <item>\n${campos.map(([k, v]) => `      <${k}>${esc(v)}</${k}>`).join('\n')}\n    </item>`;
}

export function feedGoogle(produtos: ProductWithRelations[]): string {
  const itens = produtos.map(item).filter(Boolean).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)} — bolsas no atacado</title>
    <link>${esc(SITE_URL)}</link>
    <description>Bolsas, mochilas e malas no atacado, direto do Brás.</description>
${itens}
  </channel>
</rss>
`;
}
