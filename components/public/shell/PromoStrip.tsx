'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CloseIcon } from '@/components/public/icons';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';

/**
 * A faixa do topo diz a regra da casa antes de qualquer outra coisa: quem
 * chega querendo uma peça avulsa precisa saber disso na primeira linha, e não
 * depois de escolher a bolsa e abrir o WhatsApp.
 */
export function PromoStrip() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="uni-promo-strip" role="region" aria-label="Como vendemos">
      <div className="uni-promo-strip-inner">
        <span>Venda só no atacado</span>
        <em>a partir de {PEDIDO_MINIMO} peças</em>
        {/* Some no mobile pra faixa caber em uma linha só. */}
        <Link href="/#atacado" className="uni-promo-strip-link uni-promo-word-optional">
          Como comprar
        </Link>
        <button
          className="uni-promo-strip-close"
          onClick={() => setOpen(false)}
          aria-label="Fechar aviso"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
}
