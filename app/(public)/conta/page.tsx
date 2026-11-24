import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormPerfil, FormTrocarSenha } from '@/components/public/conta/Formularios';
import { clienteAtual } from '@/lib/contas/sessao';
import { sair } from './_acoes';

export const metadata: Metadata = { title: 'Minha conta · Uni Bolsas' };

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ 'bem-vinda'?: string; senha?: string }> }) {
  const cliente = await clienteAtual();
  if (!cliente) redirect('/conta/entrar');
  const q = await searchParams;
  const primeiroNome = cliente.perfil.nome?.split(' ')[0];
  return (
    <Caixa
      largo
      rotulo="Minha conta"
      titulo={primeiroNome ? <>Olá, <em>{primeiroNome}.</em></> : <>Minha conta</>}
      sub={cliente.email}
    >
      {q['bem-vinda'] && <p className="uni-conta-aviso is-ok" role="status">E-mail confirmado. Sua conta está ativa!</p>}
      {q.senha === 'alterada' && <p className="uni-conta-aviso is-ok" role="status">Senha nova salva. As outras sessões abertas foram encerradas.</p>}

      <section className="uni-conta-bloco">
        <h2>Dados da loja</h2>
        <p className="uni-conta-pequeno">Usados nos seus pedidos e na nota fiscal.</p>
        <FormPerfil perfil={cliente.perfil} />
      </section>

      <section className="uni-conta-bloco">
        <h2>Senha</h2>
        <FormTrocarSenha />
      </section>

      <form action={sair} className="uni-conta-bloco">
        <button type="submit" className="uni-conta-btn is-linha">
          Sair da conta
        </button>
      </form>
    </Caixa>
  );
}
