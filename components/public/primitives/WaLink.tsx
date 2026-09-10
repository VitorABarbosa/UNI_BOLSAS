'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { sendHit } from '@/lib/analytics/client';

/**
 * Link pro WhatsApp que registra o clique — para os lugares onde o botão tem
 * outro desenho e não dá pra usar o `WhatsAppButton` (topo, rodapé, o
 * flutuante, a barra de compra).
 *
 * Sem isto, "cliques no WhatsApp" no painel contaria só os botões dos
 * produtos, e o dono da loja leria um número menor do que a realidade. Uma
 * métrica pela metade é pior que nenhuma: ela parece confiável.
 */
export function WaLink({
  href,
  className,
  ariaLabel,
  trackPath,
  children,
}: {
  href: string;
  className?: string;
  ariaLabel?: string;
  /** Peça a creditar. Sem ela, credita a página onde o link estava. */
  trackPath?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() =>
        sendHit({ path: trackPath ?? pathname ?? '/', kind: 'wa' })
      }
    >
      {children}
    </a>
  );
}
