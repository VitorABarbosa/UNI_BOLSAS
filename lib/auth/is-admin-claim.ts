/**
 * Reads the `is_admin` claim injected by the `custom_access_token_hook`.
 *
 * Pure (no `next/headers`, no `'server-only'`, no runtime-specific imports),
 * so it works from both the proxy (Node.js) and any server context.
 */
export function isAdminClaim(
  claims: Record<string, unknown> | null | undefined,
): boolean {
  return claims?.is_admin === true;
}
