/** Truncate a string to `max` chars (whitespace-collapsed) with an ellipsis. */
export function truncate(str: string, max: number): string {
  const clean = str.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

/** Format a number as Brazilian-style price: 89.5 -> "R$ 89,50". */
export function formatPriceBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}
