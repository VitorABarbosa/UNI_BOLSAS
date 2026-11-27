'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Logo } from '@/components/public/primitives/Logo';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { CloseIcon } from '@/components/public/icons';
import { waGeneral, waWholesale } from '@/lib/whatsapp';
import { PEDIDO_MINIMO_FRASE } from '@/lib/content/atacado';
import { useContasVisiveis } from '@/components/public/conta/ContaBotao';

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
  const contas = useContasVisiveis();

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
        <Link href="/#looks" onClick={close} className="uni-mobile-menu-link">
          Look<em>b</em>ook
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
        {contas && (
          <Link href="/conta" onClick={close} className="uni-mobile-menu-link">
            Minha c<em>o</em>nta
          </Link>
        )}
      </div>
      <div className="uni-mobile-menu-foot">
        <p className="uni-mobile-menu-note">
          {COMPRA_NO_SITE ? `Compra pelo site, ${PEDIDO_MINIMO_FRASE}.` : `Venda só no atacado, ${PEDIDO_MINIMO_FRASE}.`}
        </p>
        {COMPRA_NO_SITE ? (
          <>
            <Link href="/#catalogo" onClick={close} className="uni-hero-buy is-full">
              Comprar agora
            </Link>
            <WhatsAppButton href={waGeneral} variant="outline" full>
              Tirar dúvidas
            </WhatsAppButton>
          </>
        ) : (
          <WhatsAppButton href={waWholesale} variant="dark" full>
            Pedir no atacado
          </WhatsAppButton>
        )}
      </div>
    </div>
  );
}
