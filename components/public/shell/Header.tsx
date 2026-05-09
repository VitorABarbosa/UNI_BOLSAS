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
            >
              <WhatsAppIcon size={14} />
              <span>WhatsApp</span>
            </a>
            <button
              className="uni-header-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
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
