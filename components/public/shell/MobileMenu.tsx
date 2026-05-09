'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/public/primitives/Logo';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { CloseIcon } from '@/components/public/icons';
import { waGeneral } from '@/lib/whatsapp';
import { TOKENS } from '@/lib/tokens';

type MobileMenuProps = {
  onClose: () => void;
};

export function MobileMenu({ onClose }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const close = () => onClose();

  return (
    <div className="uni-mobile-menu" role="dialog" aria-modal="true">
      <div className="uni-mobile-menu-head">
        <Logo size={22} />
        <button
          onClick={close}
          className="uni-promo-strip-close"
          style={{ position: 'static', color: TOKENS.ink, transform: 'none' }}
          aria-label="Fechar menu"
        >
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="uni-mobile-menu-links">
        <a href="#catalogo" onClick={close} className="uni-mobile-menu-link">
          Cat<em>á</em>logo
        </a>
        <a href="#atacado" onClick={close} className="uni-mobile-menu-link">
          At<em>a</em>cado
        </a>
        <a href="#visite" onClick={close} className="uni-mobile-menu-link">
          V<em>i</em>site a loja
        </a>
        <a href="#faq" onClick={close} className="uni-mobile-menu-link">
          F<em>A</em>Q
        </a>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <WhatsAppButton href={waGeneral} variant="dark" full>
          Falar pelo WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
