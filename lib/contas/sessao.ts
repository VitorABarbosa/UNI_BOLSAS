import 'server-only';
import { createClient as criarSemCookie } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Perfil } from '@/lib/contas/regras';
import { REF_PEDIDO } from '@/lib/checkout/tipos';

export type Cliente = {
  id: string;
  email: string;
  perfil: Partial<Perfil>;
  /** Códigos dos pedidos que ela abriu no site, do mais novo pro mais antigo. */
  pedidos: string[];
};

/**
 * A cliente logada, conferida no servidor do Supabase (getUser, nunca só o
 * cookie). Conta sem e-mail confirmado não vale como logada.
 */
export async function clienteAtual(): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const u = data?.user;
  if (error || !u || !u.email || !u.email_confirmed_at) return null;
  const m = (u.user_metadata ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof m[k] === 'string' ? (m[k] as string) : undefined);
  // `app_metadata` só o servidor (chave de serviço) escreve: a cliente não
  // consegue pendurar o pedido de outra pessoa na própria conta.
  const lista = (u.app_metadata as Record<string, unknown> | undefined)?.pedidos;
  const pedidos = Array.isArray(lista) ? lista.filter((r): r is string => typeof r === 'string' && REF_PEDIDO.test(r)) : [];
  return {
    id: u.id,
    email: u.email,
    perfil: {
      nome: s('nome'),
      empresa: s('empresa'),
      cnpj: s('cnpj'),
      telefone: s('telefone'),
      cep: s('cep'),
      rua: s('rua'),
      numero: s('numero'),
      complemento: s('complemento'),
      bairro: s('bairro'),
      cidade: s('cidade'),
      uf: s('uf'),
      ie: s('ie'),
    },
    pedidos,
  };
}

/**
 * Cliente do Supabase que não grava cookie nenhum. Serve pra conferir a
 * senha atual na troca de senha sem mexer na sessão aberta.
 */
export function supabaseSemSessao() {
  return criarSemCookie(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
