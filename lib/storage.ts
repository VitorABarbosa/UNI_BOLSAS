import 'server-only';
import { createAdminClient } from './supabase/admin';

const BATCH_SIZE = 1000;

/**
 * Best-effort batch delete from the `products` bucket.
 *
 * Uses the admin (service-role) client so cleanup still works even if the
 * caller's session was revoked between the auth check and now.
 *
 * Failures are logged and swallowed — orphaned objects are preferable to a
 * half-applied row delete. Callers should typically run this AFTER the
 * authoritative DB delete succeeds.
 */
export async function removeStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const supabase = createAdminClient();

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const chunk = paths.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.storage.from('products').remove(chunk);
    if (error) {
      console.error(
        `removeStorageObjects: chunk ${i / BATCH_SIZE} failed`,
        error.message,
      );
      // swallow and continue — better to leak storage than abort cleanup
    }
  }
}
