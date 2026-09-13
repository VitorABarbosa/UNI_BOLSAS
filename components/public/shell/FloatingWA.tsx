'use client';

import { useEffect, useRef, useState } from 'react';
import { WhatsAppIcon } from '@/components/public/icons';
import { waGeneral } from '@/lib/whatsapp';
import { TOKENS } from '@/lib/tokens';

/** Rolagem a partir da qual o botão aparece. */
const SHOW_AFTER_PX = 600;
/** Silêncio de rolagem antes de abrir o balão. */
const IDLE_MS = 900;
/** Tempo que o balão fica aberto se ninguém interagir. */
const TIP_MS = 5000;

export function FloatingWA() {
  const [visible, setVisible] = useState(false);
  const [tipShown, setTipShown] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * O balão só abre quando a rolagem para, e some no primeiro toque ou na
   * rolagem seguinte. Antes ele abria no meio da navegação e ficava 6s em
   * cima dos cards do catálogo — justo enquanto a pessoa olhava os produtos.
   */
  useEffect(() => {
    if (!visible || tipDismissed) return;

    const clear = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };

    const dismiss = () => {
      clear();
      setTipShown(false);
      setTipDismissed(true);
    };

    const armIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setTipShown(true);
        hideTimer.current = setTimeout(dismiss, TIP_MS);
      }, IDLE_MS);
    };

    const onScroll = () => {
      // Rolou de novo: se o balão já estava aberto, sai da frente de vez.
      setTipShown((shown) => {
        if (shown) {
          clear();
          setTipDismissed(true);
          return false;
        }
        armIdle();
        return shown;
      });
    };

    armIdle();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', dismiss);
    return () => {
      clear();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', dismiss);
    };
  }, [visible, tipDismissed]);

  if (!visible) return null;

  return (
    <div className="uni-float-wa-wrap">
      <span
        className={'uni-float-wa-tip ' + (tipShown ? 'is-shown' : '')}
        aria-hidden={!tipShown}
      >
        Fale com a gente · <strong>respondemos em até 5min</strong>
      </span>
      <a
        href={waGeneral}
        target="_blank"
        rel="noopener noreferrer"
        className="uni-float-wa"
        aria-label="Falar pelo WhatsApp"
      >
        <WhatsAppIcon size={26} color={TOKENS.pearl} />
      </a>
    </div>
  );
}
