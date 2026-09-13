import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Medição de audiência do site, guardada no Storage do Supabase.
 *
 * POR QUE NÃO UMA TABELA: criar tabela exige SQL no painel do Supabase, que
 * não está acessível. O Storage funciona — é a mesma técnica da seleção de
 * destaques, no mesmo bucket.
 *
 * COMO OS DADOS VIVEM: cada visita vira um arquivo VAZIO cujo NOME carrega os
 * dados (hora, aparelho, visitante, origem, página). Escrever nomes distintos
 * nunca conflita — dois visitantes ao mesmo tempo não se atropelam, o que uma
 * lista num JSON único não garantiria. E como tudo está no nome, o painel lê
 * o dia inteiro com UMA listagem, sem baixar arquivo por arquivo.
 *
 * Dias fechados são compactados: viram um resumo único e os arquivos crus são
 * apagados. O bucket não cresce sem limite e a leitura de 30 dias custa ~30
 * downloads pequenos + 1 listagem (a de hoje).
 */
const BUCKET = 'site-config';
const RAW = 'analytics/raw';
const SUMMARY = 'analytics/summary';

/** Teto de arquivos lidos por dia — proteção contra pico ou abuso. */
const MAX_RAW_PER_DAY = 4000;
/** Visitantes distintos guardados por resumo. Acima disso, só a contagem. */
const MAX_VIDS_PER_SUMMARY = 3000;

export type Hit = {
  /** Caminho da página, sem query ("/", "/produtos/bolsa-x"). */
  path: string;
  /** Hostname de onde a pessoa veio (só sites externos), ou null. */
  ref: string | null;
  /** 'm' celular · 'd' computador. */
  device: 'm' | 'd';
  /** Id anônimo do cookie, ou null quando a pessoa não aceitou. */
  vid: string | null;
};

export type DaySummary = {
  views: number;
  paths: Record<string, number>;
  refs: Record<string, number>;
  devices: Record<string, number>;
  vids: string[];
  /** Visitas sem cookie (a pessoa não aceitou): contam views, não únicos. */
  anon: number;
};

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const unb64 = (s: string) => {
  try {
    return Buffer.from(s, 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

const emptyDay = (): DaySummary => ({
  views: 0,
  paths: {},
  refs: {},
  devices: {},
  vids: [],
  anon: 0,
});

async function ensureBucket(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

/**
 * Grava uma visita. Falha em silêncio de propósito: medição nunca pode
 * derrubar nem atrasar a navegação de quem visita.
 */
export async function recordHit(hit: Hit): Promise<void> {
  try {
    const supabase = createAdminClient();
    await ensureBucket(supabase);

    const day = new Date().toISOString().slice(0, 10);
    const rand = Math.random().toString(36).slice(2, 8);
    // Os campos viajam no nome, separados por ponto (base64url não tem
    // ponto). '~' marca campo vazio.
    const name = [
      Date.now().toString(36) + rand,
      hit.device,
      hit.vid ?? '~',
      hit.ref ? b64(hit.ref).slice(0, 64) : '~',
      b64(hit.path).slice(0, 128),
    ].join('.');

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${RAW}/${day}/${name}.json`, '1', {
        contentType: 'application/json',
      });
    if (error) console.warn('[analytics] gravação falhou:', error.message);
  } catch (err) {
    console.warn(
      '[analytics] gravação falhou:',
      err instanceof Error ? err.message : err,
    );
  }
}

function parseRawName(name: string, into: DaySummary): void {
  const parts = name.replace(/\.json$/, '').split('.');
  if (parts.length !== 5) return;
  const [, device, vid, ref, path] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];
  into.views += 1;
  into.devices[device] = (into.devices[device] ?? 0) + 1;
  if (vid === '~') into.anon += 1;
  else if (!into.vids.includes(vid) && into.vids.length < MAX_VIDS_PER_SUMMARY)
    into.vids.push(vid);
  if (ref !== '~') {
    const host = unb64(ref);
    if (host) into.refs[host] = (into.refs[host] ?? 0) + 1;
  }
  const p = unb64(path) || '(desconhecida)';
  into.paths[p] = (into.paths[p] ?? 0) + 1;
}

async function listRaw(
  supabase: ReturnType<typeof createAdminClient>,
  day: string,
): Promise<string[]> {
  const names: string[] = [];
  const PAGE = 1000;
  for (let offset = 0; offset < MAX_RAW_PER_DAY; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(`${RAW}/${day}`, { limit: PAGE, offset });
    if (error || !data || data.length === 0) break;
    names.push(...data.map((f) => f.name));
    if (data.length < PAGE) break;
  }
  return names;
}

async function aggregateDay(
  supabase: ReturnType<typeof createAdminClient>,
  day: string,
): Promise<{ summary: DaySummary; rawNames: string[] }> {
  const summary = emptyDay();
  const rawNames = await listRaw(supabase, day);
  for (const name of rawNames) parseRawName(name, summary);
  return { summary, rawNames };
}

/**
 * Resumos dos últimos `days` dias, do mais antigo ao mais recente.
 *
 * Dias fechados saem do resumo compactado; na primeira leitura após o dia
 * virar, o resumo é gravado e os arquivos crus são apagados. O dia corrente é
 * sempre agregado ao vivo. Qualquer falha vira dia zerado — o painel abre.
 */
export async function readAnalytics(
  days: number,
): Promise<Record<string, DaySummary>> {
  const out: Record<string, DaySummary> = {};
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return out;
  }

  const today = new Date().toISOString().slice(0, 10);

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    try {
      if (day === today) {
        out[day] = (await aggregateDay(supabase, day)).summary;
        continue;
      }

      const { data } = await supabase.storage
        .from(BUCKET)
        .download(`${SUMMARY}/${day}.json`);
      if (data) {
        out[day] = { ...emptyDay(), ...(JSON.parse(await data.text()) as DaySummary) };
        continue;
      }

      const { summary, rawNames } = await aggregateDay(supabase, day);
      out[day] = summary;
      if (rawNames.length === 0) continue;

      // Compacta: resumo primeiro; só apaga os crus se o resumo foi gravado.
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${SUMMARY}/${day}.json`, JSON.stringify(summary), {
          upsert: true,
          contentType: 'application/json',
        });
      if (!error) {
        for (let j = 0; j < rawNames.length; j += 500) {
          await supabase.storage
            .from(BUCKET)
            .remove(
              rawNames.slice(j, j + 500).map((n) => `${RAW}/${day}/${n}`),
            );
        }
      }
    } catch (err) {
      console.warn(
        `[analytics] leitura de ${day} falhou:`,
        err instanceof Error ? err.message : err,
      );
      out[day] = emptyDay();
    }
  }
  return out;
}
