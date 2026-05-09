import type { Database } from '@/types/db';

type ColorRow = Database['public']['Tables']['product_colors']['Row'];
type ImageRow = Database['public']['Tables']['product_images']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

export type ProductLike = Pick<ProductRow, 'name'> & {
  colors: ColorRow[];
  images: ImageRow[];
};

export type GalleryImage = {
  storage_path: string;
  alt: string;
};

function defaultAlt(productName: string, colorName: string): string {
  return `${productName} ${colorName}`.trim();
}

function imageToGallery(
  img: ImageRow,
  productName: string,
  colorName: string,
): GalleryImage {
  return {
    storage_path: img.storage_path,
    alt: img.alt && img.alt.trim() ? img.alt : defaultAlt(productName, colorName),
  };
}

/**
 * Returns gallery images: selected color FIRST (sorted), then generic
 * (color_id == null, sorted). Empty array if no images at all.
 */
export function galleryImages(
  product: ProductLike,
  selectedColor: ColorRow | null | undefined,
): GalleryImage[] {
  const colorImages =
    selectedColor != null
      ? product.images
          .filter((i) => i.color_id === selectedColor.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => imageToGallery(i, product.name, selectedColor.name))
      : [];

  const genericImages = product.images
    .filter((i) => i.color_id == null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => imageToGallery(i, product.name, selectedColor?.name ?? ''));

  return [...colorImages, ...genericImages];
}

/**
 * Card cover: first image of the selected color, fallback to first generic,
 * fallback to null.
 */
export function cardCoverImage(
  product: ProductLike,
  selectedColor: ColorRow | null | undefined,
): GalleryImage | null {
  const list = galleryImages(product, selectedColor);
  return list[0] ?? null;
}

function hexToRgb(h: string): [number, number, number] {
  const m = h.replace('#', '');
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function colorClose(a: string, b: string): boolean {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const d = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  return d < 28;
}

/**
 * True if any of the product's colors matches `paletteHex` (RGB distance < 28).
 * If `paletteHex` is null → no filter applied → always true.
 */
export function productHasColor(
  product: { colors: Pick<ColorRow, 'hex' | 'accent_hex'>[] },
  paletteHex: string | null,
): boolean {
  if (!paletteHex) return true;
  const target = paletteHex.toLowerCase();
  return product.colors.some((c) => {
    const h = c.hex.toLowerCase();
    return h === target || colorClose(h, target);
  });
}
