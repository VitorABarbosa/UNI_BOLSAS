import 'server-only';
import { lerJson, gravarJson } from '@/lib/automacao/armazem';
import { createAdminClient } from '@/lib/supabase/admin';
import { soDigitos } from '@/lib/contas/regras';

/**
 * NCM (código fiscal do tipo de produto) por categoria do catálogo.
 * Guardado num JSON privado do Storage: { "<id da categoria>": "42022210" }.
 * Se uma categoria não tiver NCM, vale o NFE_NCM da Hostinger (se existir).
 */
const ARQUIVO = 'config/ncm-por-categoria.json';

export type CategoriaNcm = { id: string; nome: string; ncm: string };

export const ncmValido = (v: string) => /^\d{8}$/.test(v);
const ncmPadrao = () => soDigitos(process.env.NFE_NCM ?? process.env.BLING_NCM ?? '');

export async function lerNcms(): Promise<Record<string, string>> {
  return (await lerJson<Record<string, string>>(ARQUIVO)) ?? {};
}

export async function salvarNcms(mapa: Record<string, string>): Promise<void> {
  await gravarJson(ARQUIVO, mapa);
}

/** As categorias do catálogo, cada uma com o NCM escolhido (ou vazio). */
export async function categoriasComNcm(): Promise<CategoriaNcm[]> {
  const { data, error } = await createAdminClient().from('categories').select('id, label').order('sort_order');
  if (error) throw new Error(error.message);
  const mapa = await lerNcms();
  return (data ?? []).map((c) => ({ id: c.id, nome: c.label, ncm: mapa[c.id] ?? '' }));
}

/** Falta NCM em alguma categoria (sem padrão para cobrir)? Devolve os nomes. */
export async function categoriasSemNcm(): Promise<string[]> {
  if (ncmValido(ncmPadrao())) return [];
  return (await categoriasComNcm()).filter((c) => !ncmValido(c.ncm)).map((c) => c.nome);
}

/**
 * O NCM de cada peça do pedido (pelo id do produto). Lança erro dizendo
 * qual categoria está sem NCM, pra aparecer no painel.
 */
export async function ncmDosProdutos(ids: string[]): Promise<Map<string, string>> {
  const mapa = await lerNcms();
  const padrao = ncmPadrao();
  const resultado = new Map<string, string>();
  const produtos = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const categorias = new Map<string, string>();
  if (produtos.length) {
    const { data, error } = await createAdminClient().from('products').select('id, category_id, categories(label)').in('id', produtos);
    if (error) throw new Error(error.message);
    for (const p of data ?? []) {
      const nome = (p.categories as { label?: string } | null)?.label ?? 'sem categoria';
      categorias.set(p.id, nome);
      const ncm = mapa[p.category_id] || padrao;
      if (ncmValido(ncm)) resultado.set(p.id, ncm);
    }
  }
  const faltando = new Set<string>();
  for (const id of ids) {
    if (resultado.has(id)) continue;
    if (ncmValido(padrao)) resultado.set(id, padrao);
    else faltando.add(categorias.get(id) ?? 'produto fora do catálogo');
  }
  if (faltando.size) {
    throw new Error(`Falta o NCM da categoria ${[...faltando].join(', ')} (Integrações → NCM por categoria).`);
  }
  return resultado;
}
