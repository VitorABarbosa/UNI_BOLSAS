import type { Metadata } from 'next';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormConfirmar } from '@/components/public/conta/Formularios';

export const metadata: Metadata = {
  title: 'Confirmar · Uni Bolsas',
  // O link carrega um código de uso único: não pode vazar pra outro site.
  referrer: 'no-referrer',
};

/**
 * Página de destino dos links dos e-mails. Abrir não faz nada sozinho: a
 * confirmação acontece no clique (ver `confirmarLink`), pra que o antivírus
 * do e-mail, que "abre" links pra checar, não gaste o link de uso único.
 */
export default async function ConfirmarPage({ searchParams }: { searchParams: Promise<{ tipo?: string; t?: string }> }) {
  const { tipo = '', t = '' } = await searchParams;
  const senha = tipo === 'senha';
  return (
    <Caixa
      rotulo="Sua conta"
      titulo={senha ? <>Nova senha</> : <>Ativar conta</>}
      sub={senha ? 'Toque abaixo para continuar e criar sua senha nova.' : 'Toque abaixo para confirmar seu e-mail e ativar a conta.'}
    >
      <FormConfirmar tipo={tipo} t={t} />
    </Caixa>
  );
}
