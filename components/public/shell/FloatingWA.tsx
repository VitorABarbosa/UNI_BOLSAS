'use client';

import { useEffect, useState } from 'react';
import { WhatsAppIcon } from '@/components/public/icons';
import { waGeneral } from '@/lib/whatsapp';
import { TOKENS } from '@/lib/tokens';

export function FloatingWA() {
  const [visible, setVisible] = useState(false);
  const [tipShown, setTipShown] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!visible || tipDismissed) {
      setTipShown(false);
      return;
    }
    const t1 = setTimeout(() => setTipShown(true), 350);
    const t2 = setTimeout(() => setTipShown(false), 6500);
    const t3 = setTimeout(() => setTipDismissed(true), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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
