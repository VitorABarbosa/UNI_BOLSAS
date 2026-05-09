import { z } from 'zod';

const nullableStringFromInput = (max?: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    max ? z.string().max(max).nullable() : z.string().nullable(),
  );

export const ImageInsertSchema = z.object({
  product_id: z.string().uuid(),
  color_id: z.string().uuid().nullable(),
  storage_path: z.string().min(1),
  alt: nullableStringFromInput(200),
  sort_order: z.coerce.number().int().min(0),
});

export const ImageUpdateAltSchema = z.object({
  id: z.string().uuid(),
  alt: nullableStringFromInput(200),
});

export const ImageReorderSchema = z.object({
  product_id: z.string().uuid(),
  color_id: z.string().uuid().nullable(),
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export type ImageInsertInput = z.infer<typeof ImageInsertSchema>;
export type ImageUpdateAltInput = z.infer<typeof ImageUpdateAltSchema>;
export type ImageReorderInput = z.infer<typeof ImageReorderSchema>;
