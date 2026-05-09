import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/db';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`listCategories failed: ${error.message}`);
  }
  return data ?? [];
}
