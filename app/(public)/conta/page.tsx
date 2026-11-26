import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormPerfil, FormTrocarSenha } from '@/components/public/conta/Formularios';
import { clienteAtual } from '@/lib/contas/sessao';
import { sair } from './_acoes';
import Link from 'next/link';
import { SacolaPendente } from '@/components/public/checkout/SacolaPendente';
import { andamentoDosPedidos, fotosDosPedidos, listarMeusPedidos } from '@/lib/checkout/meus-pedidos';
import { ListaPedidos } from '@/components/public/conta/ListaPedidos';

export const metadata: Metadata = { title: 'Minha conta · Uni Bolsas' };

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ 'bem-vinda'?: string; senha?: string }> }) {
  const cliente = await clienteAtual();
  if (!cliente) redirect('/conta/entrar');
  const q = await searchParams;
  const primeiroNome = cliente.perfil.nome?.split(' ')[0];
  const pedidos = await listarMeusPedidos(cliente.id, cliente.pedidos, 5);
  const [fotos, andamento] = pedidos ? await Promise.all([fotosDosPedidos(pedidos.map((p) => p.pagamento)), andamentoDosPedidos(pedidos)]) : [new Map(), new Map()];
  return (
    <Caixa
      largo
      rotulo="Minha conta"
      titulo={primeiroNome ? <>Olá, <em>{primeiroNome}.</em></> : <>Minha conta</>}
      sub={cliente.email}
    >
      {q['bem-vinda'] && <p className="uni-conta-aviso is-ok" role="status">E-mail confirmado. Sua conta está ativa!</p>}
      {q.senha === 'alterada' && <p className="uni-conta-aviso is-ok" role="status">Senha nova salva. As outras sessões abertas foram encerradas.</p>}

      <nav className="uni-conta-atalhos" aria-label="Seções da conta">
        <a href="#pedidos">Meus pedidos</a>
        <a href="#dados">Dados da loja</a>
        <a href="#senha">Senha</a>
      </nav>

      <SacolaPendente />

      <section className="uni-conta-bloco" id="pedidos">
        <h2>Meus pedidos</h2>
        {pedidos === null ? (
          <p className="uni-conta-pequeno">Não conseguimos carregar seus pedidos agora. Atualize a página em instantes.</p>
        ) : pedidos.length === 0 ? (
          <p className="uni-conta-pequeno">
            Você ainda não fez pedidos pelo site. <Link href="/#catalogo">Ver o catálogo</Link>
          </p>
        ) : (
          <>
            <ListaPedidos pedidos={pedidos} fotos={fotos} andamento={andamento} />
            {cliente.pedidos.length > pedidos.length && (
              <p className="uni-conta-pequeno uni-historico-todos">
                <Link href="/conta/pedidos">Ver todos os pedidos →</Link>
              </p>
            )}
          </>
        )}
      </section>

      <section className="uni-conta-bloco" id="dados">
        <h2>Dados da loja</h2>
        <p className="uni-conta-pequeno">Usados nos seus pedidos e na nota fiscal.</p>
        <FormPerfil perfil={cliente.perfil} />
      </section>

      <section className="uni-conta-bloco" id="senha">
        <h2>Senha</h2>
        {/* Fechado de propósito: trocar a senha é raro e não pode ficar à
            mão de quem só abriu a conta pra ver um pedido. Quem esqueceu a
            senha usa o "Esqueci minha senha" (pelo e-mail), não este. */}
        <details className="uni-conta-senha">
          <summary>
            <span className="uni-conta-senha-pontos" aria-hidden="true">••••••••</span>
            <span className="uni-conta-senha-link">Trocar senha</span>
          </summary>
          <p className="uni-conta-pequeno">Para trocar, confirme a senha atual. As outras sessões abertas serão encerradas.</p>
          <FormTrocarSenha />
        </details>
        <p className="uni-conta-pequeno uni-conta-senha-dica">
          Esqueceu a senha? Saia da conta e use “Esqueci minha senha” na tela de entrar.
        </p>
      </section>

      <form action={sair} className="uni-conta-bloco">
        <button type="submit" className="uni-conta-btn is-linha">
          Sair da conta
        </button>
      </form>
    </Caixa>
  );
}
