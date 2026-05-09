import type { ReactNode } from 'react';
import { WhatsAppIcon } from '@/components/public/icons';

type WhatsAppButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'default' | 'dark' | 'outline';
  full?: boolean;
  icon?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function WhatsAppButton({
  href,
  children,
  variant = 'default',
  full = false,
  icon = true,
  className = '',
  ariaLabel,
}: WhatsAppButtonProps) {
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
    >
      {icon && <WhatsAppIcon size={16} />}
      <span>{children}</span>
    </a>
  );
}
