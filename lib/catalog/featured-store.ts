import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { MAX_FEATURED } from './featured';

/**
 * Quais peças estão em destaque na home.
 *
 * POR QUE NÃO UMA COLUNA: seria o lugar natural, mas criar coluna exige rodar
 * SQL no painel do Supabase — a API que o site usa faz CRUD, não DDL. Sem esse
 * acesso, o recurso não existiria.
 *
 * POR QUE UM BUCKET SÓ PRA ISTO: a primeira versão gravava no bucket
 * `products`, e ele tem lista de tipos permitidos — só imagem, que é a
 * configuração certa pra um bucket público que recebe foto. O JSON era
 * recusado com "mime type application/json is not supported". Em vez de
 * afrouxar a segurança do bucket das fotos, a configuração ganha o seu:
 * privado, sem restrição de tipo, criado pela própria aplicação na primeira
 * gravação — `createBucket` é operação de dados, não de esquema, então
 * funciona com a chave que o site já tem.
 *
 * O custo honesto: a lista não tem integridade referencial. Um produto
 * excluído deixa o id órfão aqui. Não faz mal — a consulta filtra por produto
 * ativo e simplesmente não o encontra, então a vitrine encolhe sozinha.
 */
const BUCKET = 'site-config';
const PATH = 'featured.json';

export { MAX_FEATURED };

/**
 * Cria o bucket na primeira vez. Só a escrita chama isto: a leitura acontece
 * a cada render da home e não deve pagar uma ida extra ao servidor pra
 * confirmar algo que, depois do primeiro clique, sempre existe.
 */
async function ensureBucket(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  // Corrida entre dois cliques ao mesmo tempo: o outro criou primeiro, que é
  // exatamente o que queríamos.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(
      `não consegui criar o espaço de configuração (${error.message})`,
    );
  }
}

export async function readFeaturedIds(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(PATH);
    // Bucket ou arquivo ainda não existem = ninguém escolheu nada. Não é erro.
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
  await ensureBucket(supabase);

  const unique = [...new Set(ids)].slice(0, MAX_FEATURED);
  // Texto puro, e não Blob: com Blob o supabase-js embrulha em
  // multipart/form-data, o que só acrescenta envelope pra alguns bytes de
  // JSON. Como string, o corpo vai cru e o content-type é exatamente o que
  // declaramos.
  const { error } = await supabase.storage.from(BUCKET).upload(PATH, JSON.stringify(unique), {
    upsert: true,
    contentType: 'application/json',
    // Sem cache: a mudança feita no painel tem que valer na hora. O arquivo
    // tem alguns bytes, então não há o que economizar aqui.
    cacheControl: '0',
  });
  if (error) throw new Error(`gravação falhou: ${error.message}`);
}
