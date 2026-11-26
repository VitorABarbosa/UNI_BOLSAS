'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { UserIcon } from '@/components/public/icons';

/**
 * Botão "Minha conta" do cabeçalho. Só aparece com as contas ligadas, ou
 * neste navegador quando o link de prévia foi aberto (cookie `uni-contas`).
 * O cookie aqui só decide se o botão aparece; quem libera de verdade é o
 * servidor, pelo cookie protegido.
 */
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';

const LIGADAS = COMPRA_NO_SITE;

function lerPrevia(): boolean {
  return LIGADAS || document.cookie.split('; ').includes('uni-contas=1');
}

export function useContasVisiveis(): boolean {
  return useSyncExternalStore(
    () => () => {},
    lerPrevia,
    () => LIGADAS,
  );
}

export function ContaBotao({ className }: { className?: string }) {
  if (!useContasVisiveis()) return null;
  return (
    <Link href="/conta" className={'uni-pedido-icone uni-conta-botao ' + (className ?? '')} aria-label="Minha conta" prefetch={false}>
      <UserIcon size={20} />
    </Link>
  );
}
