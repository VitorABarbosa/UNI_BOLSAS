/**
 * Avisos de medição mandados pelo navegador. Não roda no servidor.
 *
 * `keepalive` deixa o aviso sobreviver quando a pessoa sai da página no meio
 * do envio — o clique no WhatsApp abre outra aba, e sem isso o registro se
 * perderia justamente no evento que mais interessa.
 *
 * Falha em silêncio de propósito: medição nunca pode virar erro pra quem
 * está navegando.
 */
export function sendHit(body: {
  path: string;
  ref?: string;
  kind?: 'view' | 'wa';
}): void {
  void fetch('/api/hit', {
    method: 'POST',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}
