'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from '@/components/public/icons';
import { sendHit } from '@/lib/analytics/client';

type WhatsAppButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'default' | 'dark' | 'outline';
  full?: boolean;
  icon?: boolean;
  className?: string;
  ariaLabel?: string;
  /**
   * Caminho da peça a creditar pelo clique. Sem ele o clique é creditado à
   * página onde o botão estava, o que é o certo pros botões gerais (topo,
   * rodapé, hero) e errado pro card de um produto que aparece na home.
   */
  trackPath?: string;
};

/**
 * O botão do WhatsApp — e o único lugar que registra o clique nele.
 *
 * Esse clique é o desfecho que interessa: o catálogo não vende, ele leva pra
 * conversa. Sem medir aqui, o painel mostra "quantos olharam" e nunca
 * "quantos chamaram", que é a pergunta do dono da loja.
 *
 * O registro é o mesmo evento anônimo das páginas vistas — nenhum campo novo
 * sobre a pessoa, só o caminho da peça. É por isso que ele cabe na mesma base
 * legal descrita em /privacidade.
 */
export function WhatsAppButton({
  href,
  children,
  variant = 'default',
  full = false,
  icon = true,
  className = '',
  ariaLabel,
  trackPath,
}: WhatsAppButtonProps) {
  const pathname = usePathname();
  const cls = [
    'uni-wa-btn',
    variant === 'dark' ? 'uni-wa-btn-dark' : '',
    variant === 'outline' ? 'uni-wa-btn-outline' : '',
    full ? 'uni-wa-btn-fullw' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <a
      href={href}
      className={cls}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() =>
        sendHit({ path: trackPath ?? pathname ?? '/', kind: 'wa' })
      }
    >
      {icon && <WhatsAppIcon size={16} />}
      <span>{children}</span>
    </a>
  );
}
