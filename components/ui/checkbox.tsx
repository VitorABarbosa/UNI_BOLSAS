'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Caixa de seleção do painel.
 *
 * É um `<input type="checkbox">` de verdade, com a aparência pintada por cima:
 * assim teclado, leitores de tela e o estado indeterminado continuam sendo os
 * do navegador, sem precisar reimplementá-los.
 *
 * O desenho mora em `.uni-check` (globals.css) e não em classes utilitárias:
 * o "tique" é um SVG embutido no `background-image`, e escrever isso como
 * classe arbitrária quebrava a extração do Tailwind — as regras do estado
 * marcado simplesmente não eram geradas, e a caixa ficava branca ao marcar.
 */
export function Checkbox({
  className,
  indeterminate = false,
  ...props
}: ComponentProps<'input'> & { indeterminate?: boolean }) {
  return (
    <input
      type="checkbox"
      // `indeterminate` só existe como propriedade do elemento, não como
      // atributo HTML — daí o ref em vez de passar direto.
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      className={cn('uni-check', className)}
      {...props}
    />
  );
}
