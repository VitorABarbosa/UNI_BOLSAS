'use client';

import { useSyncExternalStore } from 'react';
import { CONSENT_EVENT, readConsent, type Consent } from '@/lib/consent';

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/**
 * A escolha de cookies como estado externo, que é o que ela é: mora num
 * cookie, muda por um evento e precisa valer igual em todo componente que
 * dependa dela (o aviso e o mapa).
 *
 * `useSyncExternalStore` em vez de `useEffect` + `useState`: no servidor não
 * existe cookie, então o primeiro render é sempre "ninguém escolheu" e o
 * React reconcilia sozinho depois da hidratação — sem render em cascata e
 * sem descompasso entre o HTML e a tela.
 */
export function useConsent(): Consent | null {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
