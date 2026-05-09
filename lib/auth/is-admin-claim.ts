/**
 * Reads the `is_admin` claim injected by the `custom_access_token_hook`.
 *
 * Edge-compatible by design: NO `next/headers`, NO `'server-only'`, NO Node
 * imports. Safe to use from middleware running on the Edge runtime.
 */
export function isAdminClaim(
  claims: Record<string, unknown> | null | undefined,
): boolean {
  return claims?.is_admin === true;
}
