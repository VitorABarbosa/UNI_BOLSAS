import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Arquivos JSON PRIVADOS no Storage do Supabase (bucket `site-config`, o
 * mesmo dos destaques). Guarda o que precisa durar entre um pedido e outro
 * sem tabela nova: a conexão com o Bling e o andamento de cada pedido
 * (nota, etiqueta, rastreio).
 *
 * O bucket é privado e só a chave de serviço (no servidor) lê e grava.
 */
const BUCKET = 'site-config';

async function garantirBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) {
    // Defesa: este bucket guarda token do Bling. Se alguém o deixou público,
    // não gravamos nada sensível nele.
    if (data.public) throw new Error(`o bucket ${BUCKET} está público; deixe-o privado antes de usar a automação`);
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw new Error(`não consegui criar ${BUCKET}: ${error.message}`);
}

export async function lerJson<T>(caminho: string): Promise<T | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(caminho);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

export async function gravarJson(caminho: string, valor: unknown): Promise<void> {
  const supabase = createAdminClient();
  await garantirBucket(supabase);
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, JSON.stringify(valor), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });
  if (error) throw new Error(`gravação de ${caminho} falhou: ${error.message}`);
}
