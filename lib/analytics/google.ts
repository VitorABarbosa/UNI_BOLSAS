/**
 * Google Analytics 4 — o identificador e o mínimo de cola em volta dele.
 *
 * O id vem de variável de ambiente, e não escrito no código, por dois
 * motivos: dá pra desligar o Analytics sem mexer em código (basta esvaziar a
 * variável), e o site roda sem ele — em desenvolvimento ninguém quer sujar a
 * conta de produção com visitas de teste.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/**
 * Manda um evento pro GA, se e somente se ele estiver carregado.
 *
 * O `gtag` só existe depois do aceite nos cookies — quem recusou nunca tem a
 * função na página, então esta chamada simplesmente não faz nada. É de
 * propósito: o lugar que decide é o consentimento, não quem chama.
 */
export function gaEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params ?? {});
}
