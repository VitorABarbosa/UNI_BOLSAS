/**
 * Consentimento de cookies — a fonte única da escolha da pessoa.
 *
 * Fica fora do componente do aviso porque três lugares precisam dela: o
 * próprio aviso, o botão "Preferências de cookies" no rodapé (LGPD art. 8º,
 * §5º: revogar tem que ser tão fácil quanto aceitar) e o mapa, que só carrega
 * o Google depois de um aceite.
 */
export const CONSENT_COOKIE = 'uni_consent';
export const CONSENT_DAYS = 180;

export type Consent = 'all' | 'essential';

/** Evento que reabre o aviso. O rodapé dispara, o aviso escuta. */
export const CONSENT_EVENT = 'uni:consent';

export function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  const v = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split('=')[1];
  return v === 'all' || v === 'essential' ? v : null;
}

export function writeConsent(value: Consent): void {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${CONSENT_DAYS * 86400}; path=/; samesite=lax`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Reabre o aviso pra pessoa mudar de ideia. */
export function openConsentDialog(): void {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: 'open' }));
}
