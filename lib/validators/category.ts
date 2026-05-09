import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const CategorySchema = z.object({
  slug: z.string().regex(SLUG_REGEX).min(1).max(60),
  label: z.string().min(1).max(80),
  sort_order: z.coerce.number().int().min(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
