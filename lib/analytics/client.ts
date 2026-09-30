import { gaEvent } from './google';

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
  kind?: 'view' | 'wa' | 'consent';
}): void {
  // O mesmo clique vai pros dois lugares: pro painel da casa, que conta até
  // quem recusou cookies, e pro Google Analytics, onde ele fecha o funil
  // ("quantos viram a peça e quantos chamaram"). No GA só chega se a pessoa
  // aceitou — `gaEvent` não faz nada quando o gtag não está na página.
  if (body.kind === 'wa') {
    gaEvent('contato_whatsapp', { peca: body.path });
  }
  void fetch('/api/hit', {
    method: 'POST',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}
