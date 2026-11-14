'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/public/primitives/Logo';
import { MenuIcon, WhatsAppIcon } from '@/components/public/icons';
import { MobileMenu } from '@/components/public/shell/MobileMenu';
import { waGeneral } from '@/lib/whatsapp';
import { WaLink } from '@/components/public/primitives/WaLink';

/**
 * As seções do menu. Os endereços começam em `/` de propósito: `#catalogo`
 * sozinho só funciona na home — na página de uma peça o clique não levava a
 * lugar nenhum, porque lá não existe seção com esse id.
 */
export const NAV_LINKS = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'atacado', label: 'Como comprar' },
  { id: 'faq', label: 'Dúvidas' },
  { id: 'visite', label: 'Visite' },
] as const;

/**
 * Qual seção está na tela agora, pra marcar o item do menu.
 *
 * Vale a seção mais baixa cujo topo já passou da linha logo abaixo do
 * cabeçalho.
 * É lido da posição real a cada rolagem (num frame só), e não de um
 * IntersectionObserver: com seções de alturas muito diferentes o observer
 * marcava duas ao mesmo tempo ou nenhuma.
 */
function useActiveSection(enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      // A mais baixa entre as que já passaram da linha — pela posição na
      // página, não pela ordem do menu, que pode não ser a mesma.
      let current: string | null = null;
      let currentTop = -Infinity;
      for (const { id } of NAV_LINKS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top != null && top <= line && top > currentTop) {
          current = id;
          currentTop = top;
        }
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled]);

  return enabled ? active : null;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(usePathname() === '/');

  return (
    <>
      <header className="uni-header">
        <div className="uni-header-inner">
          <Logo size={22} />
          <nav className="uni-header-nav" aria-label="Navegação principal">
            {NAV_LINKS.map(({ id, label }) => (
              <Link
                key={id}
                href={`/#${id}`}
                className={
                  'uni-header-link' + (active === id ? ' is-active' : '')
                }
                aria-current={active === id ? 'location' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="uni-header-right">
            <WaLink
              href={waGeneral}
              className="uni-header-cta"
              ariaLabel="Falar pelo WhatsApp"
            >
              <WhatsAppIcon size={14} />
              {/* Em telas ≤380px o rótulo some e sobra só o ícone (44×44). */}
              <span className="uni-header-cta-label">WhatsApp</span>
            </WaLink>
            <button
              className="uni-header-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
