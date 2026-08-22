'use client';

import { useState } from 'react';
import { CloseIcon } from '@/components/public/icons';
import { PROMO } from '@/lib/content/promo';

export function PromoStrip() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="uni-promo-strip" role="region" aria-label="Promoção">
      <div className="uni-promo-strip-inner">
        <span>Primeira compra</span>
        <em>5% OFF</em>
        {/* Palavra de ligação: some no mobile pra faixa caber em uma linha só. */}
        <span className="uni-promo-word-optional">com o cupom</span>
        <span className="uni-promo-strip-cup">{PROMO.code}</span>
        <button
          className="uni-promo-strip-close"
          onClick={() => setOpen(false)}
          aria-label="Fechar promoção"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
}
