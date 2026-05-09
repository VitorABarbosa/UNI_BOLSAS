import { z } from 'zod';

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const nullableHexFromInput = () =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().regex(HEX_REGEX).nullable(),
  );

export const ColorSchema = z.object({
  name: z.string().min(1).max(60),
  hex: z.string().regex(HEX_REGEX),
  accent_hex: nullableHexFromInput(),
  sort_order: z.coerce.number().int().min(0),
});

export const ColorWithIdSchema = ColorSchema.extend({
  id: z.string().uuid(),
});

export type ColorInput = z.infer<typeof ColorSchema>;
export type ColorWithIdInput = z.infer<typeof ColorWithIdSchema>;
