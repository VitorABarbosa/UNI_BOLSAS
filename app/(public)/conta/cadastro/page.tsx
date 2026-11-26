import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormCadastro } from '@/components/public/conta/Formularios';
import { clienteAtual } from '@/lib/contas/sessao';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';

export const metadata: Metadata = { title: 'Criar conta · Uni Bolsas' };

export default async function CadastroPage() {
  if (await clienteAtual()) redirect('/conta');
  return (
    <Caixa
      largo
      rotulo="Atacado"
      titulo={<>Criar conta</>}
      sub={`Com CPF ou CNPJ: compras a partir de ${PEDIDO_MINIMO} peças, com seus dados salvos para os próximos pedidos.`}
    >
      <FormCadastro />
    </Caixa>
  );
}
