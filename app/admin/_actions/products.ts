'use server';

import { revalidatePath } from 'next/cache';
import { ProductSchema, type ProductInput } from '@/lib/validators/product';
import { requireAdmin } from '@/lib/auth/require-admin';
import { removeStorageObjects } from '@/lib/storage';
import { MAX_FEATURED, writeFeaturedIds } from '@/lib/catalog/featured-store';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data, error } = await supabase
    .from('products')
    .insert(parsed.data)
    .select('id, slug')
    .single();
  if (error) {
    if (error.code === '23505')
      return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath(`/produtos/${data.slug}`);

  return { ok: true, data: { id: data.id } };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data: prev } = await supabase
    .from('products')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('products').update(parsed.data).eq('id', id);
  if (error) {
    if (error.code === '23505')
      return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  if (prev?.slug && prev.slug !== parsed.data.slug)
    revalidatePath(`/produtos/${prev.slug}`);
  revalidatePath(`/produtos/${parsed.data.slug}`);

  return { ok: true, data: undefined };
}

/**
 * Tira o produto do site sem apagá-lo do banco.
 *
 * É o caminho certo pra "esse produto não faz sentido aqui": a linha continua
 * existindo, então a importação da planilha reconhece o nome e PULA. Excluir
 * de verdade apaga essa memória, e a importação seguinte recria o produto —
 * foi o que aconteceu quando os produtos removidos voltaram sozinhos.
 */
export async function setProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: product, error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', id)
    .select('slug')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/produtos');
  if (product?.slug) revalidatePath(`/produtos/${product.slug}`);

  return { ok: true, data: undefined };
}

/**
 * A mesma coisa, para vários de uma vez.
 *
 * Um `update ... in (...)` em vez de N chamadas: tirar trinta produtos do site
 * vira uma ida ao banco, não trinta. Devolve quantos mudaram de fato, que é o
 * número que a tela mostra.
 */
export async function setProductsActive(
  ids: string[],
  active: boolean,
): Promise<ActionResult<{ count: number }>> {
  const { supabase } = await requireAdmin();
  if (ids.length === 0) return { ok: true, data: { count: 0 } };

  const { data, error } = await supabase
    .from('products')
    .update({ active })
    .in('id', ids)
    .select('slug');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/produtos');
  for (const p of data ?? []) revalidatePath(`/produtos/${p.slug}`);

  return { ok: true, data: { count: data?.length ?? 0 } };
}

/**
 * Põe (ou tira) peças da vitrine "Destaques da casa".
 *
 * A seleção mora no Storage, não numa coluna — veja
 * `lib/catalog/featured-store` para o porquê. Aqui a lista é lida, alterada e
 * regravada inteira: são no máximo doze ids, então não vale a pena inventar
 * escrita incremental.
 */
/**
 * Grava a vitrine INTEIRA, e não "adicione este id" / "tire aquele id".
 *
 * A primeira versão lia a lista, mexia nela e gravava de volta. Parecia
 * inofensivo com um clique por vez, mas dois cliques seguidos se atropelavam:
 * a segunda leitura acontecia antes da primeira gravação, então a segunda
 * gravação apagava a primeira. Na prática a estrela "não pegava" — o clique
 * ia embora sem deixar rastro, e era preciso clicar de novo.
 *
 * Mandando a seleção completa, o painel diz o que quer que a vitrine seja, e
 * o último clique é sempre o que vale. Não há nada que se perca entre uma
 * leitura e uma gravação, porque não há leitura.
 */
export async function setFeaturedSelection(
  ids: string[],
): Promise<ActionResult<{ total: number }>> {
  await requireAdmin();

  const unique = [...new Set(ids)];
  if (unique.length > MAX_FEATURED) {
    return {
      ok: false,
      error: `A vitrine cabe ${MAX_FEATURED} peças — tire alguma antes de pôr mais.`,
    };
  }

  try {
    await writeFeaturedIds(unique);
    revalidatePath('/');
    revalidatePath('/admin/produtos');
    return { ok: true, data: { total: unique.length } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Grava a ordem do catálogo.
 *
 * Recebe a lista COMPLETA de ids na ordem desejada, e não "mova esta peça
 * três casas pra cima". O painel sabe como quer o catálogo inteiro; mandar a
 * intenção pronta evita que dois arrastes seguidos se atropelem — é a mesma
 * escolha feita na vitrine de destaques, e pela mesma razão.
 *
 * Só as peças que realmente mudaram de lugar são gravadas. Arrastar uma peça
 * do fim para o topo de um catálogo de duzentas move todas as outras uma casa
 * — mas sem esse filtro seriam duzentas escritas mesmo quando o admin só
 * trocou duas peças de lugar.
 */
export async function reorderProducts(
  orderedIds: string[],
): Promise<ActionResult<{ changed: number }>> {
  const { supabase } = await requireAdmin();
  if (orderedIds.length === 0) return { ok: true, data: { changed: 0 } };

  const { data: atuais, error: readError } = await supabase
    .from('products')
    .select('id, sort_order');
  if (readError) return { ok: false, error: readError.message };

  const posicaoAtual = new Map(
    (atuais ?? []).map((p) => [p.id, p.sort_order] as const),
  );

  const mudaram: { id: string; sort_order: number }[] = [];
  orderedIds.forEach((id, i) => {
    // Ids que não existem mais (peça excluída noutra aba) são ignorados em
    // vez de virarem erro: a ordem que sobrou continua válida.
    if (posicaoAtual.has(id) && posicaoAtual.get(id) !== i) {
      mudaram.push({ id, sort_order: i });
    }
  });
  if (mudaram.length === 0) return { ok: true, data: { changed: 0 } };

  // O PostgREST não atualiza linhas diferentes com valores diferentes numa
  // requisição só, então vão em lotes paralelos — não uma por uma.
  const LOTE = 25;
  for (let i = 0; i < mudaram.length; i += LOTE) {
    const resultados = await Promise.all(
      mudaram
        .slice(i, i + LOTE)
        .map(({ id, sort_order }) =>
          supabase.from('products').update({ sort_order }).eq('id', id),
        ),
    );
    const falhou = resultados.find((r) => r.error);
    if (falhou?.error) return { ok: false, error: falhou.error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  return { ok: true, data: { changed: mudaram.length } };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', id)
    .single();
  const { data: imgs } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id);

  const paths = (imgs ?? []).map((i) => i.storage_path);
  if (paths.length > 0) await removeStorageObjects(paths);

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  if (product?.slug) revalidatePath(`/produtos/${product.slug}`);

  return { ok: true, data: undefined };
}
