import { z } from 'zod';

/**
 * Nullable string from an <input>. Trims whitespace; empty/whitespace-only/undefined/null → null.
 * Optional max length; optional regex (e.g., for hex colors).
 */
export const nullableStringFromInput = (opts?: { max?: number; regex?: RegExp }) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        return trimmed === '' ? null : trimmed;
      }
      return v;
    },
    (() => {
      let s = z.string();
      if (opts?.regex) s = s.regex(opts.regex);
      if (opts?.max !== undefined) s = s.max(opts.max);
      return s.nullable();
    })(),
  );
