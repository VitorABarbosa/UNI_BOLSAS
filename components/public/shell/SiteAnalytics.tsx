'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Registra cada página vista. Não renderiza nada.
 *
 * Envia mesmo sem consentimento de cookies: uma visita anônima e agregada
 * ("alguém abriu a home") não identifica ninguém — é o cookie de visitante
 * que depende do aceite, e quem decide isso é o servidor (app/api/hit),
 * olhando o cookie de consentimento que ele mesmo recebe.
 *
 * `keepalive` deixa o aviso sobreviver quando a pessoa navega pra fora no
 * meio do envio — sem atrasar nada na tela.
 */
export function SiteAnalytics() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    // O referrer externo só faz sentido na primeira página da sessão; nas
    // navegações internas seguintes ele apontaria pro próprio site.
    const ref = last.current === null ? document.referrer : '';
    last.current = pathname;

    void fetch('/api/hit', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: pathname, ref }),
    }).catch(() => {
      /* medição nunca vira erro pra quem navega */
    });
  }, [pathname]);

  return null;
}
