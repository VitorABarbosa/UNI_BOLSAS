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
  // Campo vazio no formulário significa "sem promoção", não zero.
  price_promo: z
    .union([z.literal(''), z.coerce.number().positive()])
    .nullish()
    .transform((v) => (v === '' || v == null ? null : Number(v))),
  promo_ends_at: z
    .union([z.literal(''), z.string()])
    .nullish()
    .transform((v) => (v === '' || v == null ? null : v)),
  dimensions: nullableStringFromInput({ max: 100 }),
  weight: nullableStringFromInput({ max: 60 }),
  material: nullableStringFromInput({ max: 200 }),
  sizes: z.array(z.string().min(1).max(40)).min(1),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  seo_title: nullableStringFromInput({ max: 70 }),
  seo_description: nullableStringFromInput({ max: 160 }),
})
  // O banco tem a mesma checagem; aqui a mensagem chega no campo certo do
  // formulário em vez de voltar como erro cru do Postgres.
  .refine(
    (v) => v.price_promo == null || v.price_promo < v.price_retail,
    {
      message: 'O preço promocional precisa ser menor que o preço de varejo',
      path: ['price_promo'],
    },
  );

export type ProductInput = z.infer<typeof ProductSchema>;
