import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { RETAIN_DAYS } from './policy';

/**
 * Medição de audiência do site, guardada no Storage do Supabase.
 *
 * POR QUE NÃO UMA TABELA: criar tabela exige SQL no painel do Supabase, que
 * não está acessível. O Storage funciona — é a mesma técnica da seleção de
 * destaques, no mesmo bucket.
 *
 * COMO OS DADOS VIVEM: cada evento vira um arquivo VAZIO cujo NOME carrega os
 * campos. Escrever nomes distintos nunca conflita — dois visitantes ao mesmo
 * tempo não se atropelam, o que uma lista num JSON único não garantiria. E
 * como tudo está no nome, o painel lê o dia inteiro com UMA listagem, sem
 * baixar arquivo por arquivo.
 *
 * Dias fechados são compactados: viram um resumo único e os arquivos crus são
 * apagados. Resumos com mais de um ano são apagados também (veja
 * `pruneOldSummaries`) — a LGPD não deixa guardar dado pra sempre.
 *
 * O QUE NÃO ENTRA AQUI, por decisão de projeto: IP, nome, e-mail, telefone,
 * geolocalização, impressão digital do navegador, e nada que venha de
 * terceiros. O texto da política em /privacidade descreve exatamente estes
 * campos — se um campo novo entrar neste arquivo, a política muda junto.
 */
const BUCKET = 'site-config';
const RAW = 'analytics/raw';
const SUMMARY = 'analytics/summary';

/** Teto de arquivos lidos por dia — proteção contra pico ou abuso. */
const MAX_RAW_PER_DAY = 4000;
/** Visitantes distintos guardados por resumo. Acima disso, só a contagem. */
const MAX_VIDS_PER_SUMMARY = 3000;
export { RETAIN_DAYS };

/** Fuso da loja. O servidor roda em UTC; o dia comercial é o de São Paulo. */
const TZ = 'America/Sao_Paulo';

/** Dia (YYYY-MM-DD) e hora (00-23) em São Paulo, não em UTC. */
export function spDayHour(d: Date = new Date()): { day: string; hour: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const hour = parts.hour ?? '00';
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    // Intl devolve "24" pra meia-noite em alguns runtimes.
    hour: hour === '24' ? '00' : hour,
  };
}

/** Tipo de evento: página vista ou clique no botão do WhatsApp. */
export type HitKind = 'view' | 'wa';

export type Hit = {
  /** Caminho da página, sem query ("/", "/produtos/bolsa-x"). */
  path: string;
  /** Hostname de onde a pessoa veio (só sites externos), ou null. */
  ref: string | null;
  /** 'm' celular · 'd' computador. */
  device: 'm' | 'd';
  /** Id anônimo do cookie, ou null quando a pessoa não aceitou. */
  vid: string | null;
  kind: HitKind;
  /** true quando o id acabou de ser criado (primeira visita com cookie). */
  isNew: boolean;
};

export type DaySummary = {
  /** Páginas vistas (não conta clique no WhatsApp). */
  views: number;
  paths: Record<string, number>;
  refs: Record<string, number>;
  devices: Record<string, number>;
  vids: string[];
  /** Visitas sem cookie (recusou ou ainda não escolheu): views, não únicos. */
  anon: number;
  /** Páginas vistas por hora do dia em São Paulo ("00".."23"). */
  hours: Record<string, number>;
  /** Cliques no botão do WhatsApp. */
  waClicks: number;
  /** Cliques no WhatsApp por peça (ou pela página onde o botão estava). */
  waPaths: Record<string, number>;
  /** Visitantes com cookie que apareceram pela primeira vez. */
  newVisitors: number;
  /** Visitantes com cookie que já tinham vindo antes. */
  returning: number;
};

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const unb64 = (s: string) => {
  try {
    return Buffer.from(s, 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

export const emptyDay = (): DaySummary => ({
  views: 0,
  paths: {},
  refs: {},
  devices: {},
  vids: [],
  anon: 0,
  hours: {},
  waClicks: 0,
  waPaths: {},
  newVisitors: 0,
  returning: 0,
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
 * Grava um evento. Falha em silêncio de propósito: medição nunca pode
 * derrubar nem atrasar a navegação de quem visita.
 */
export async function recordHit(hit: Hit): Promise<void> {
  try {
    const supabase = createAdminClient();
    await ensureBucket(supabase);

    const { day, hour } = spDayHour();
    const rand = Math.random().toString(36).slice(2, 8);
    // Os campos viajam no nome, separados por ponto (base64url não tem
    // ponto). '~' marca campo vazio. A primeira letra do 2º campo é o tipo
    // do evento, a segunda diz se o visitante é novo (n), recorrente (r) ou
    // sem cookie (~).
    const flags =
      (hit.kind === 'wa' ? 'w' : 'v') +
      (hit.vid ? (hit.isNew ? 'n' : 'r') : '~');
    const name = [
      Date.now().toString(36) + rand,
      flags,
      hit.device,
      hour,
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

/**
 * Lê um nome de arquivo cru para dentro do resumo.
 *
 * Aceita os DOIS formatos: o antigo, de 5 campos e só páginas vistas, e o
 * novo, de 7. Um deploy não pode zerar o que foi medido de manhã.
 */
function parseRawName(name: string, into: DaySummary): void {
  const parts = name.replace(/\.json$/, '').split('.');

  let flags = 'v~';
  let device: string;
  let hour: string | null = null;
  let vid: string;
  let ref: string;
  let path: string;

  if (parts.length === 7) {
    [, flags, device, hour, vid, ref, path] = parts as [
      string, string, string, string, string, string, string,
    ];
  } else if (parts.length === 5) {
    [, device, vid, ref, path] = parts as [
      string, string, string, string, string,
    ];
  } else {
    return;
  }

  const isWa = flags[0] === 'w';
  const visitor = flags[1];

  if (isWa) {
    into.waClicks += 1;
    const p = unb64(path) || '(desconhecida)';
    into.waPaths[p] = (into.waPaths[p] ?? 0) + 1;
  } else {
    into.views += 1;
    into.devices[device] = (into.devices[device] ?? 0) + 1;
    if (hour) into.hours[hour] = (into.hours[hour] ?? 0) + 1;
    if (ref !== '~') {
      const host = unb64(ref);
      if (host) into.refs[host] = (into.refs[host] ?? 0) + 1;
    }
    const p = unb64(path) || '(desconhecida)';
    into.paths[p] = (into.paths[p] ?? 0) + 1;
  }

  if (vid === '~') {
    if (!isWa) into.anon += 1;
  } else {
    if (!into.vids.includes(vid) && into.vids.length < MAX_VIDS_PER_SUMMARY) {
      into.vids.push(vid);
      // Novo/recorrente conta uma vez por visitante, não por página.
      if (visitor === 'n') into.newVisitors += 1;
      else if (visitor === 'r') into.returning += 1;
    }
  }
}

async function listAll(
  supabase: ReturnType<typeof createAdminClient>,
  prefix: string,
  cap: number,
): Promise<string[]> {
  const names: string[] = [];
  const PAGE = 1000;
  for (let offset = 0; offset < cap; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE, offset });
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
  const rawNames = await listAll(supabase, `${RAW}/${day}`, MAX_RAW_PER_DAY);
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

  const today = spDayHour().day;

  for (let i = days - 1; i >= 0; i--) {
    const day = spDayHour(new Date(Date.now() - i * 86400_000)).day;
    try {
      if (day === today) {
        out[day] = (await aggregateDay(supabase, day)).summary;
        continue;
      }

      const { data } = await supabase.storage
        .from(BUCKET)
        .download(`${SUMMARY}/${day}.json`);
      if (data) {
        out[day] = {
          ...emptyDay(),
          ...(JSON.parse(await data.text()) as DaySummary),
        };
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

/**
 * Apaga resumos com mais de `RETAIN_DAYS` dias.
 *
 * A LGPD (art. 15 e 16) trata prazo como parte do tratamento: dado guardado
 * além da finalidade é dado guardado sem base legal. Isto roda junto com a
 * abertura do painel — não precisa de agendador, e o painel é aberto com
 * frequência suficiente. Devolve quantos resumos foram apagados.
 */
export async function pruneOldSummaries(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const limit = spDayHour(
      new Date(Date.now() - RETAIN_DAYS * 86400_000),
    ).day;

    const names = await listAll(supabase, SUMMARY, 5000);
    const velhos = names
      .filter((n) => n.endsWith('.json') && n.slice(0, 10) < limit)
      .map((n) => `${SUMMARY}/${n}`);
    if (velhos.length === 0) return 0;

    for (let i = 0; i < velhos.length; i += 500) {
      await supabase.storage.from(BUCKET).remove(velhos.slice(i, i + 500));
    }
    return velhos.length;
  } catch (err) {
    console.warn(
      '[analytics] limpeza de resumos antigos falhou:',
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}
