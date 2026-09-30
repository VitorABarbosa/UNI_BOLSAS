'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONSENT_EVENT,
  openConsentDialog,
  readConsent,
  writeConsent,
  type Consent,
} from '@/lib/consent';
import { useConsent } from '@/hooks/useConsent';
import { sendHit } from '@/lib/analytics/client';

/**
 * Aviso de cookies, no tom da casa.
 *
 * Duas escolhas de verdade — aceitar ou ficar só no essencial — com o mesmo
 * peso visual, porque a LGPD (art. 8º) exige consentimento livre: recusar não
 * pode ser um link escondido nem um botão apagado.
 *
 * O aviso diz, em uma frase, o que é medido, e abre a lista item por item pra
 * quem quiser conferir — informação clara e adequada é requisito do art. 9º,
 * não gentileza. O texto completo fica em /privacidade.
 *
 * A escolha vale por 180 dias e pode ser trocada a qualquer momento pelo
 * rodapé (art. 8º, §5º). Até a pessoa decidir, nenhum cookie de medição é
 * criado — quem confere isso é o servidor, por conta própria.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [details, setDetails] = useState(false);
  const current = useConsent();

  useEffect(() => {
    // Quem já escolheu não vê o aviso de novo — só pelo rodapé. E quem não
    // escolheu não tem escolha pra mostrar, então `current` fica nulo aqui:
    // ele só é lido quando a reabertura pede.
    if (readConsent()) return;
    // Entra depois da primeira pintura: a pessoa vê o site antes do aviso.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // O rodapé pede a reabertura por evento — sem estado global, sem contexto.
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== 'open') return;
      setDetails(false);
      setLeaving(false);
      setOpen(true);
    };
    window.addEventListener(CONSENT_EVENT, onEvent);
    return () => window.removeEventListener(CONSENT_EVENT, onEvent);
  }, []);

  const choose = useCallback((value: Consent) => {
    writeConsent(value);
    // O `uni_vid` é httpOnly: o navegador não consegue apagá-lo sozinho. Sem
    // este aviso ao servidor, ele só sumiria na próxima página aberta — e a
    // política promete que some na hora em que a pessoa muda de ideia.
    sendHit({ path: window.location.pathname, kind: 'consent' });
    setLeaving(true);
    setTimeout(() => setOpen(false), 350);
  }, []);

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
          Contamos quantas pessoas visitam o site e quais bolsas despertam
          mais interesse — por conta própria e pelo Google Analytics. Sem
          nome, sem e-mail e sem anúncio. Recusar não tira nada do site.
        </p>

        <button
          type="button"
          className="uni-cookie-more"
          aria-expanded={details}
          onClick={() => setDetails((d) => !d)}
        >
          {details ? 'Esconder' : 'O que exatamente é medido'}
        </button>

        {details && (
          <div className="uni-cookie-details">
            <p className="uni-cookie-details-head">
              Só o essencial — sempre, sem cookie:
            </p>
            <ul>
              <li>a página aberta e o horário</li>
              <li>se veio de celular ou computador</li>
              <li>o site de onde você chegou, se houver</li>
            </ul>
            <p className="uni-cookie-details-head">
              Aceitando, entram também:
            </p>
            <ul>
              <li>
                um cookie nosso com um código sorteado, pra não contar você
                duas vezes e saber se já tinha vindo
              </li>
              <li>
                o <strong>Google Analytics</strong>, que nos mostra de onde
                você chegou e o que despertou interesse — e que recebe seu
                acesso
              </li>
              <li>nenhum deles guarda nome, e-mail ou telefone</li>
              <li>
                tudo é desligado e apagado no dia em que você mudar de ideia
              </li>
            </ul>
          </div>
        )}

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

        <p className="uni-cookie-foot">
          {current && (
            <>
              Sua escolha hoje:{' '}
              <strong>
                {current === 'all' ? 'aceitar' : 'só o essencial'}
              </strong>{' '}
              ·{' '}
            </>
          )}
          <Link href="/privacidade">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Botão que reabre o aviso. Mora no rodapé: revogar o consentimento precisa
 * ser tão fácil quanto foi dá-lo, e um aviso que nunca mais aparece depois do
 * primeiro clique não cumpre isso.
 */
export function CookiePrefsButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={openConsentDialog}>
      Preferências de cookies
    </button>
  );
}
