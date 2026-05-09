import { z } from 'zod';

/**
 * Helper para campos string nullable que vêm de <input>.
 * Converte string vazia ou undefined em null antes de validar,
 * evitando que `.nullable()` reclame de "" em campos opcionais.
 */
const nullableStringFromInput = (max?: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    max ? z.string().max(max).nullable() : z.string().nullable(),
  );

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX).min(1).max(120),
  tagline: nullableStringFromInput(200),
  description: nullableStringFromInput(),
  category_id: z.string().uuid(),
  badge: nullableStringFromInput(40),
  price_retail: z.coerce.number().min(0),
  price_wholesale: nullableStringFromInput(60),
  dimensions: nullableStringFromInput(100),
  weight: nullableStringFromInput(60),
  material: nullableStringFromInput(200),
  sizes: z.array(z.string().min(1).max(40)).min(1),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  seo_title: nullableStringFromInput(70),
  seo_description: nullableStringFromInput(160),
});

export type ProductInput = z.infer<typeof ProductSchema>;
