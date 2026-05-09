import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

/**
 * Creates a Supabase auth user (email-confirmed) and registers them as an
 * admin in `public.admins`. Reads email + password from env:
 *   ADMIN_EMAIL    -- email to create
 *   ADMIN_PASSWORD -- initial password
 *
 * Idempotent: if the email already exists, looks up the existing user_id
 * and ensures the admins row is present.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL = 'you@example.com'
 *   $env:ADMIN_PASSWORD = 'strong-password'
 *   pnpm tsx scripts/create-admin.ts
 */
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  if (!email) throw new Error('ADMIN_EMAIL is not set');
  if (!password) throw new Error('ADMIN_PASSWORD is not set');

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Try create. If the email exists, look up the user_id instead.
  let userId: string;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (!/already.*registered|already.*exists|email.*exists/i.test(createError.message)) {
      throw new Error(`createUser failed: ${createError.message}`);
    }
    console.log(`  ↺ user with email ${email} already exists, looking it up...`);
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError || !list) throw new Error(`listUsers failed: ${listError?.message}`);
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) throw new Error(`could not find existing user ${email}`);
    userId = existing.id;
  } else if (!created.user) {
    throw new Error('createUser returned no user');
  } else {
    userId = created.user.id;
    console.log(`  ✅ created auth user ${email} (id: ${userId})`);
  }

  // 2. Upsert the admins row.
  const { error: adminError } = await supabase
    .from('admins')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });
  if (adminError) throw new Error(`admins upsert failed: ${adminError.message}`);

  console.log(`  ✅ ensured ${email} is in public.admins`);
  console.log('\n✅ Admin ready.');
}

main().catch((err) => {
  console.error('❌ create-admin failed:', err);
  process.exit(1);
});
