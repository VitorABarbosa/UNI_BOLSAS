import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { MAX_FEATURED } from './featured';

/**
 * Quais peças estão em destaque na home.
 *
 * POR QUE NÃO UMA COLUNA: seria o lugar natural, mas criar coluna exige rodar
 * SQL no painel do Supabase — o único caminho, já que a API que o site usa faz
 * CRUD e não DDL. Sem esse acesso, uma coluna nova nunca sairia do papel e o
 * recurso não existiria.
 *
 * O Storage, por outro lado, já funciona: é por onde todas as fotos dos
 * produtos sobem. Então a escolha vira um arquivinho lá — uma lista de ids,
 * escrita pelo painel e lida pela home. Nada de novo pra configurar.
 *
 * O custo honesto: a lista não tem integridade referencial. Um produto
 * excluído deixa o id órfão aqui. Não faz mal — a consulta simplesmente não o
 * encontra e ele some da vitrine — e `pruneFeaturedIds` limpa na próxima
 * escrita.
 */
const BUCKET = 'products';
const PATH = '_config/featured.json';

/** Teto de segurança: a vitrine é uma seleção curta, não um segundo catálogo. */
export { MAX_FEATURED } from './featured';

export async function readFeaturedIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(PATH);
    // Arquivo ainda não existe = ninguém escolheu nada ainda. Não é erro.
    if (error || !data) return [];
    const parsed: unknown = JSON.parse(await data.text());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch (err) {
    console.warn(
      '[featured] não consegui ler a seleção, seguindo sem vitrine:',
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function writeFeaturedIds(ids: string[]): Promise<void> {
  const supabase = createAdminClient();
  const unique = [...new Set(ids)].slice(0, MAX_FEATURED);
  const body = new Blob([JSON.stringify(unique)], { type: 'application/json' });

  const { error } = await supabase.storage.from(BUCKET).upload(PATH, body, {
    upsert: true,
    contentType: 'application/json',
    // Sem cache: a mudança feita no painel tem que valer na hora. O arquivo
    // tem alguns bytes, então não há o que economizar aqui.
    cacheControl: '0',
  });
  if (error) throw new Error(`featured: gravação falhou: ${error.message}`);
}
