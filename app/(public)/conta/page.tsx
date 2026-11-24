import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormPerfil, FormTrocarSenha } from '@/components/public/conta/Formularios';
import { clienteAtual } from '@/lib/contas/sessao';
import { sair } from './_acoes';
import Link from 'next/link';
import { SacolaPendente } from '@/components/public/checkout/SacolaPendente';
import { listarMeusPedidos } from '@/lib/checkout/meus-pedidos';
import { formaDePagamento, statusEmPortugues } from '@/lib/checkout/mercadopago';
import { formatPriceBRL } from '@/lib/format';

const dataCurta = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });

export const metadata: Metadata = { title: 'Minha conta · Uni Bolsas' };

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ 'bem-vinda'?: string; senha?: string }> }) {
  const cliente = await clienteAtual();
  if (!cliente) redirect('/conta/entrar');
  const q = await searchParams;
  const primeiroNome = cliente.perfil.nome?.split(' ')[0];
  const pedidos = await listarMeusPedidos(cliente.id, cliente.pedidos);
  return (
    <Caixa
      largo
      rotulo="Minha conta"
      titulo={primeiroNome ? <>Olá, <em>{primeiroNome}.</em></> : <>Minha conta</>}
      sub={cliente.email}
    >
      {q['bem-vinda'] && <p className="uni-conta-aviso is-ok" role="status">E-mail confirmado. Sua conta está ativa!</p>}
      {q.senha === 'alterada' && <p className="uni-conta-aviso is-ok" role="status">Senha nova salva. As outras sessões abertas foram encerradas.</p>}

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
          <ul className="uni-meus-pedidos">
            {pedidos.map(({ ref, pagamento: p }) => (
              <li key={ref}>
                <Link href={`/pedido/${ref}`}>
                  <span className="uni-meus-pedidos-ref">
                    <strong>{ref}</strong>
                    <small>
                      {dataCurta.format(new Date(p.date_created))} · {formaDePagamento(p)} ·{' '}
                      {p.metadata?.entrega === 'retirada' ? 'Retirada na loja' : 'Envio'}
                    </small>
                  </span>
                  <span className="uni-meus-pedidos-valor">
                    <b>{formatPriceBRL(p.transaction_amount)}</b>
                    <em className={'is-' + p.status}>{statusEmPortugues(p.status)}</em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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
