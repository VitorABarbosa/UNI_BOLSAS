'use client';

import { useEffect, useState } from 'react';

/**
 * Aviso de cookies, no tom da casa.
 *
 * Duas escolhas de verdade — aceitar ou ficar só no essencial — com o mesmo
 * peso visual de decisão livre (LGPD): recusar não é um link escondido.
 * A escolha vale por 180 dias; até a pessoa decidir, nenhum cookie de
 * medição é criado (o servidor confere isso por conta própria).
 */
const CONSENT = 'uni_consent';
const DAYS = 180;

const readConsent = () =>
  document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT}=`))
    ?.split('=')[1] ?? null;

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (readConsent()) return;
    // Entra depois da primeira pintura: a pessoa vê o site antes do aviso.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const choose = (value: 'all' | 'essential') => {
    document.cookie = `${CONSENT}=${value}; max-age=${DAYS * 86400}; path=/; samesite=lax`;
    setLeaving(true);
    setTimeout(() => setOpen(false), 350);
  };

  if (!open) return null;

  return (
    <div
      className={'uni-cookie' + (leaving ? ' is-leaving' : '')}
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
    >
      <div className="uni-cookie-inner">
        <p className="uni-cookie-title">
          Um cafezinho? Não temos. <em>Cookies</em>, sim.
        </p>
        <p className="uni-cookie-text">
          Usamos um cookie anônimo pra saber quantas pessoas visitam o site e
          quais bolsas despertam mais interesse — sem nome, sem e-mail, sem
          vender nada pra ninguém. Você escolhe:
        </p>
        <div className="uni-cookie-actions">
          <button
            type="button"
            className="uni-cookie-accept"
            onClick={() => choose('all')}
          >
            Aceitar
          </button>
          <button
            type="button"
            className="uni-cookie-decline"
            onClick={() => choose('essential')}
          >
            Só o essencial
          </button>
        </div>
      </div>
    </div>
  );
}
