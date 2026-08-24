import { z } from 'zod';

import { nullableStringFromInput } from './_helpers';

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX).min(1).max(120),
  tagline: nullableStringFromInput({ max: 200 }),
  description: nullableStringFromInput(),
  category_id: z.string().uuid(),
  badge: nullableStringFromInput({ max: 40 }),
  price_retail: z.coerce.number().min(0),
  price_wholesale: nullableStringFromInput({ max: 60 }),
  dimensions: nullableStringFromInput({ max: 100 }),
  weight: nullableStringFromInput({ max: 60 }),
  material: nullableStringFromInput({ max: 200 }),
  sizes: z.array(z.string().min(1).max(40)).min(1),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  seo_title: nullableStringFromInput({ max: 70 }),
  seo_description: nullableStringFromInput({ max: 160 }),
});

export type ProductInput = z.infer<typeof ProductSchema>;
