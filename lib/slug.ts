/**
 * Convert an arbitrary string into a URL-safe slug.
 *
 * Steps:
 * 1. NFD-normalize and strip combining marks (removes diacritics)
 * 2. Lowercase
 * 3. Collapse runs of non-alphanumeric chars into a single hyphen
 * 4. Trim leading/trailing hyphens
 * 5. Fall back to `'item'` if the result is empty
 */
export function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // remove diacritics (combining marks block)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}
