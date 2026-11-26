import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClienteAdmin = {
  id: string;
  email: string;
  confirmado: boolean;
  criadoEm: string;
  ultimoAcesso: string | null;
  nome: string;
  empresa: string;
  cnpj: string;
  telefone: string;
  cidade: string;
  uf: string;
};

/** As contas de cliente do site (sem as de administrador). */
export async function listarClientes(): Promise<ClienteAdmin[]> {
  const admin = createAdminClient();
  const { data: admins } = await admin.from('admins').select('user_id');
  const ids = new Set((admins ?? []).map((a) => a.user_id));
  const todos: ClienteAdmin[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      if (ids.has(u.id)) continue;
      const m = (u.user_metadata ?? {}) as Record<string, unknown>;
      const t = (k: string) => (typeof m[k] === 'string' ? (m[k] as string) : '');
      todos.push({
        id: u.id,
        email: u.email ?? '',
        confirmado: !!u.email_confirmed_at,
        criadoEm: u.created_at,
        ultimoAcesso: u.last_sign_in_at ?? null,
        nome: t('nome'),
        empresa: t('empresa'),
        cnpj: t('cnpj'),
        telefone: t('telefone'),
        cidade: t('cidade'),
        uf: t('uf'),
      });
    }
    if (data.users.length < 1000) break;
  }
  return todos.sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));
}
