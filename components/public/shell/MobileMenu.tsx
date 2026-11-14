'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Logo } from '@/components/public/primitives/Logo';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { CloseIcon } from '@/components/public/icons';
import { waWholesale } from '@/lib/whatsapp';
import { PEDIDO_MINIMO_FRASE } from '@/lib/content/atacado';

type MobileMenuProps = {
  onClose: () => void;
};

export function MobileMenu({ onClose }: MobileMenuProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const close = () => onClose();

  return (
    <div className="uni-mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="uni-mobile-menu-head">
        <Logo size={22} />
        <button
          onClick={close}
          className="uni-mobile-menu-close"
          aria-label="Fechar menu"
        >
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="uni-mobile-menu-links">
        <Link href="/#catalogo" onClick={close} className="uni-mobile-menu-link">
          Cat<em>á</em>logo
        </Link>
        <Link href="/#atacado" onClick={close} className="uni-mobile-menu-link">
          Como c<em>o</em>mprar
        </Link>
        <Link href="/#faq" onClick={close} className="uni-mobile-menu-link">
          D<em>ú</em>vidas
        </Link>
        <Link href="/#visite" onClick={close} className="uni-mobile-menu-link">
          V<em>i</em>site a loja
        </Link>
      </div>
      <div className="uni-mobile-menu-foot">
        <p className="uni-mobile-menu-note">
          Venda só no atacado, {PEDIDO_MINIMO_FRASE}.
        </p>
        <WhatsAppButton href={waWholesale} variant="dark" full>
          Pedir no atacado
        </WhatsAppButton>
      </div>
    </div>
  );
}
