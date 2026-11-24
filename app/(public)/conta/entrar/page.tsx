import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormEntrar } from '@/components/public/conta/Formularios';
import { clienteAtual } from '@/lib/contas/sessao';
import { destinoSeguro } from '@/lib/contas/regras';

export const metadata: Metadata = { title: 'Entrar · Uni Bolsas' };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destino = destinoSeguro(next);
  if (await clienteAtual()) redirect(destino);
  return (
    <Caixa rotulo="Sua conta" titulo={<>Entrar</>} sub="Acesse com o e-mail e a senha da sua conta de atacado.">
      <FormEntrar next={destino} />
    </Caixa>
  );
}
