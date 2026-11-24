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
  const comprando = destino.startsWith('/finalizar');
  return (
    <Caixa
      rotulo={comprando ? 'Finalizar compra' : 'Sua conta'}
      titulo={<>Entrar</>}
      sub={
        comprando
          ? 'Para pagar pelo site, entre na sua conta de atacado. Primeira vez? Crie a conta em 1 minuto: suas peças continuam na sacola.'
          : 'Acesse com o e-mail e a senha da sua conta de atacado.'
      }
    >
      <FormEntrar next={destino} />
    </Caixa>
  );
}
