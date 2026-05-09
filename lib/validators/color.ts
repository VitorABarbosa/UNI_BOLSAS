import { z } from 'zod';

import { nullableStringFromInput } from './_helpers';

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export const ColorSchema = z.object({
  name: z.string().min(1).max(60),
  hex: z.string().regex(HEX_REGEX),
  accent_hex: nullableStringFromInput({ regex: HEX_REGEX }),
  sort_order: z.coerce.number().int().min(0),
});

export const ColorWithIdSchema = ColorSchema.extend({
  id: z.string().uuid(),
});

export type ColorInput = z.infer<typeof ColorSchema>;
export type ColorWithIdInput = z.infer<typeof ColorWithIdSchema>;
