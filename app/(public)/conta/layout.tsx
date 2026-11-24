import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { contasLiberadas } from '@/lib/contas/acesso';

export const metadata: Metadata = {
  // Telas de conta não são conteúdo: fora do Google.
  robots: { index: false, follow: false },
};

/**
 * Enquanto as contas não forem ligadas, estas páginas não existem pra quem
 * visita. Só abre com a variável ligada ou com o cookie do link de prévia.
 */
export default async function ContaLayout({ children }: { children: ReactNode }) {
  if (!(await contasLiberadas())) notFound();
  return children;
}
