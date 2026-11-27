import 'server-only';
import webpush, { type PushSubscription } from 'web-push';
import { gravarJson, lerJson } from '@/lib/automacao/armazem';
import { SITE_URL } from '@/lib/seo';

/**
 * Notificações no celular do painel (Web Push).
 *
 * O painel vira um "app" (Adicionar à tela de início) e cada aparelho que
 * ativar as notificações recebe um aviso na tela a cada venda, problema ou
 * resumo — mesmo com o app fechado.
 *
 * Nada pra configurar na Hostinger: o par de chaves (VAPID) é gerado na
 * primeira vez e fica no Storage privado, junto com a lista de aparelhos.
 */
const CHAVES = 'config/notificacoes-chaves.json';
const APARELHOS = 'notificacoes/aparelhos.json';

type Chaves = { publica: string; privada: string };
export type Aparelho = { sub: PushSubscription; nome: string; email: string; desde: string };

let chavesEmMemoria: Chaves | null = null;

async function chaves(): Promise<Chaves> {
  if (chavesEmMemoria) return chavesEmMemoria;
  let c = await lerJson<Chaves>(CHAVES);
  if (!c?.publica || !c?.privada) {
    const novas = webpush.generateVAPIDKeys();
    c = { publica: novas.publicKey, privada: novas.privateKey };
    await gravarJson(CHAVES, c);
  }
  chavesEmMemoria = c;
  return c;
}

export async function chavePublica(): Promise<string> {
  return (await chaves()).publica;
}

export async function aparelhos(): Promise<Aparelho[]> {
  return (await lerJson<Aparelho[]>(APARELHOS)) ?? [];
}

export async function guardarAparelho(a: Aparelho): Promise<void> {
  const lista = (await aparelhos()).filter((x) => x.sub.endpoint !== a.sub.endpoint);
  lista.push(a);
  await gravarJson(APARELHOS, lista.slice(-20));
}

export async function esquecerAparelho(endpoint: string): Promise<void> {
  const lista = await aparelhos();
  const resto = lista.filter((x) => x.sub.endpoint !== endpoint);
  if (resto.length !== lista.length) await gravarJson(APARELHOS, resto);
}

export type Aviso = {
  titulo: string;
  texto: string;
  /** Caminho aberto ao tocar na notificação (ex.: /admin/pedidos/UB-…). */
  url?: string;
  /** Mesma etiqueta substitui a notificação anterior em vez de empilhar. */
  etiqueta?: string;
};

/**
 * Manda o aviso pra todos os aparelhos ativados. Nunca lança: falhar aqui não
 * pode atrapalhar a venda nem a checagem. Aparelho que desinstalou ou negou
 * (404/410) sai da lista.
 */
export async function avisarNoCelular(aviso: Aviso, so?: string): Promise<number> {
  try {
    const lista = (await aparelhos()).filter((a) => !so || a.sub.endpoint === so);
    if (!lista.length) return 0;
    const c = await chaves();
    webpush.setVapidDetails(SITE_URL.startsWith('https://') ? SITE_URL : 'https://unibolsas.store', c.publica, c.privada);
    const corpo = JSON.stringify({ titulo: aviso.titulo, texto: aviso.texto, url: aviso.url ?? '/admin', etiqueta: aviso.etiqueta });
    let enviados = 0;
    const mortos: string[] = [];
    await Promise.all(
      lista.map(async (a) => {
        try {
          await webpush.sendNotification(a.sub, corpo, { TTL: 24 * 60 * 60, urgency: 'high' });
          enviados++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) mortos.push(a.sub.endpoint);
          else console.error('[celular] envio falhou:', status ?? '', e instanceof Error ? e.message : e);
        }
      }),
    );
    for (const m of mortos) await esquecerAparelho(m);
    return enviados;
  } catch (e) {
    console.error('[celular] aviso falhou:', e instanceof Error ? e.message : e);
    return 0;
  }
}
