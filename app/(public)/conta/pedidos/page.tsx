import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Caixa } from '@/components/public/conta/Caixa';
import { ListaPedidos } from '@/components/public/conta/ListaPedidos';
import { clienteAtual } from '@/lib/contas/sessao';
import { andamentoDosPedidos, fotosDosPedidos, listarMeusPedidos } from '@/lib/checkout/meus-pedidos';

export const metadata: Metadata = { title: 'Meus pedidos · Uni Bolsas' };

/** Histórico completo (os últimos 30 pedidos abertos no site). */
export default async function MeusPedidosPage() {
  const cliente = await clienteAtual();
  if (!cliente) redirect('/conta/entrar?next=/conta/pedidos');
  const pedidos = await listarMeusPedidos(cliente.id, cliente.pedidos, 30);
  const [fotos, andamento] = pedidos
    ? await Promise.all([fotosDosPedidos(pedidos.map((p) => p.pagamento)), andamentoDosPedidos(pedidos)])
    : [new Map<string, string>(), new Map()];
  return (
    <Caixa largo rotulo="Minha conta" titulo={<>Meus pedidos</>} sub={<Link href="/conta">← Voltar para a minha conta</Link>}>
      {pedidos === null ? (
        <p className="uni-conta-pequeno">Não conseguimos carregar seus pedidos agora. Atualize a página em instantes.</p>
      ) : pedidos.length === 0 ? (
        <p className="uni-conta-pequeno">
          Você ainda não fez pedidos pelo site. <Link href="/#catalogo">Ver o catálogo</Link>
        </p>
      ) : (
        <ListaPedidos pedidos={pedidos} fotos={fotos} andamento={andamento} />
      )}
    </Caixa>
  );
}
