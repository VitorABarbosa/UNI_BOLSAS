'use client';

import { useState } from 'react';
import { Logo } from '@/components/public/primitives/Logo';
import { MenuIcon, WhatsAppIcon } from '@/components/public/icons';
import { MobileMenu } from '@/components/public/shell/MobileMenu';
import { waGeneral } from '@/lib/whatsapp';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="uni-header">
        <div className="uni-header-inner">
          <Logo size={22} />
          <nav className="uni-header-nav" aria-label="Navegação principal">
            <a href="#catalogo" className="uni-header-link">
              Catálogo
            </a>
            <a href="#atacado" className="uni-header-link">
              Atacado
            </a>
            <a href="#visite" className="uni-header-link">
              Visite
            </a>
          </nav>
          <div className="uni-header-right">
            <a
              href={waGeneral}
              className="uni-header-cta"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar pelo WhatsApp"
            >
              <WhatsAppIcon size={14} />
              {/* Em telas ≤380px o rótulo some e sobra só o ícone (44×44). */}
              <span className="uni-header-cta-label">WhatsApp</span>
            </a>
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
