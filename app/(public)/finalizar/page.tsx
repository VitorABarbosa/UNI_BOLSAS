import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { contasLiberadas } from '@/lib/contas/acesso';
import { clienteAtual } from '@/lib/contas/sessao';
import { Caixa } from '@/components/public/conta/Caixa';
import { Finalizar } from '@/components/public/checkout/Finalizar';

export const metadata: Metadata = {
  title: 'Finalizar compra · Uni Bolsas',
  robots: { index: false, follow: false },
};

/** Checkout: só com as contas liberadas e a cliente logada. */
export default async function FinalizarPage() {
  if (!(await contasLiberadas())) notFound();
  const cliente = await clienteAtual();
  if (!cliente) redirect('/conta/entrar?next=/finalizar');
  return (
    <Caixa largo rotulo="Compra no atacado" titulo={<>Finalizar compra</>}>
      <ol className="uni-etapas" aria-label="Etapas da compra">
        <li className="is-feita">Sacola</li>
        <li className="is-atual" aria-current="step">Dados e entrega</li>
        <li>Pagamento</li>
      </ol>
      <Finalizar perfil={cliente.perfil} email={cliente.email} />
    </Caixa>
  );
}
