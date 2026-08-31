import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

/**
 * Supabase admin client (service role). Bypasses ALL Row Level Security.
 *
 * Only callable from server-side code: the `'server-only'` import above
 * makes the module a build-time error if it ever lands in a Client
 * Component bundle. Use exclusively in scripts and trusted server code
 * (e.g. seed scripts, internal admin tasks).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: { fetch: freshFetch },
  });
}

/**
 * `fetch` sem cache nenhum, em nenhuma camada.
 *
 * Esta chave só é usada pelo painel: ler, gravar e reler o que acabou de ser
 * gravado. Uma resposta guardada — pelo cache de `fetch` do Next, pela CDN do
 * Supabase, por um proxy no caminho — aqui nunca é uma otimização, é um bug:
 * o admin clica, o servidor grava, a página recarrega e mostra o estado
 * antigo. Foi exatamente o que acontecia com a estrela dos destaques.
 *
 * `cache: 'no-store'` resolve o lado do Next; o cabeçalho resolve o resto do
 * caminho até o Supabase.
 */
const freshFetch: typeof fetch = (input, init) => {
  // `new Headers(...)` em vez de espalhar o objeto: o supabase-js às vezes
  // manda uma instância de Headers, e espalhar uma delas devolve `{}` — os
  // cabeçalhos de autenticação sumiriam.
  const headers = new Headers(init?.headers);
  headers.set('cache-control', 'no-cache');
  return fetch(input, { ...init, cache: 'no-store', headers });
};
