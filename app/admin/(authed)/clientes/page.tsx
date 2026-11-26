import { rotuloDocumento } from '@/lib/contas/regras';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { listarClientes, type ClienteAdmin } from '@/lib/admin/clientes';
import { carregarPedidos, whatsDaCliente } from '@/lib/admin/pedidos';
import { formatPriceBRL } from '@/lib/format';

export const metadata = { title: 'Clientes · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });

type Ordem = 'recentes' | 'compras';

/** Quem tem conta no site: dados da loja, contato e quanto já comprou. */
export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; ordem?: string }> }) {
  const { user } = await requireAdmin();
  const { q = '', ordem: ordemBruta } = await searchParams;
  const ordem: Ordem = ordemBruta === 'compras' ? 'compras' : 'recentes';

  let clientes: ClienteAdmin[] = [];
  let erro: string | null = null;
  try {
    clientes = await listarClientes();
  } catch (e) {
    console.error('[admin/clientes]', e instanceof Error ? e.message : e);
    erro = 'Não foi possível carregar as clientes agora.';
  }

  // Compras pagas por cliente (pelo Mercado Pago).
  const { pedidos } = await carregarPedidos();
  const compras = new Map<string, { n: number; total: number; ultima: string }>();
  for (const p of pedidos) {
    if (p.pagamento.status !== 'approved') continue;
    const id = p.pagamento.metadata?.cliente_id;
    if (!id) continue;
    const c = compras.get(id) ?? { n: 0, total: 0, ultima: p.pagamento.date_created };
    c.n++;
    c.total += p.pagamento.transaction_amount;
    if (Date.parse(p.pagamento.date_created) > Date.parse(c.ultima)) c.ultima = p.pagamento.date_created;
    compras.set(id, c);
  }

  const termo = q.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, '');
  const visiveis = clientes
    .filter((c) => {
      if (!termo) return true;
      if ([c.email, c.nome, c.empresa, c.cidade].some((x) => x.toLowerCase().includes(termo))) return true;
      return digitos.length >= 4 && [c.cnpj, c.telefone].some((x) => x.replace(/\D/g, '').includes(digitos));
    })
    .sort((a, b) => (ordem === 'compras' ? (compras.get(b.id)?.total ?? 0) - (compras.get(a.id)?.total ?? 0) : 0));

  const compradoras = clientes.filter((c) => compras.has(c.id)).length;

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Clientes">
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Numero rotulo="Contas criadas" valor={String(clientes.length)} />
          <Numero rotulo="Já compraram" valor={String(compradoras)} />
          <Numero rotulo="Sem confirmar e-mail" valor={String(clientes.filter((c) => !c.confirmado).length)} />
        </div>

        <form className="flex flex-wrap gap-2" action="/admin/clientes">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por empresa, nome, e-mail, CPF/CNPJ, telefone ou cidade"
            className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          />
          <select name="ordem" defaultValue={ordem} className="rounded-md border border-stone-300 bg-white px-2 py-2 text-sm">
            <option value="recentes">Mais recentes</option>
            <option value="compras">Quem mais comprou</option>
          </select>
          <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Buscar</button>
        </form>

        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}
        {!erro && visiveis.length === 0 && <p className="rounded-lg border bg-white p-6 text-center text-sm text-stone-500">Nenhuma cliente encontrada.</p>}

        <ul className="space-y-2">
          {visiveis.map((c) => {
            const k = compras.get(c.id);
            const whats = whatsDaCliente(c.telefone, `Olá, ${c.nome.split(' ')[0] || 'tudo bem'}! Aqui é da Uni Bolsas.`);
            return (
              <li key={c.id} className="flex flex-col gap-3 rounded-lg border bg-white p-4 text-sm md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.empresa || c.nome || c.email}</span>
                    {!c.confirmado && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">e-mail não confirmado</span>}
                    {!c.cnpj && c.confirmado && <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">cadastro incompleto</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500">
                    {[c.nome, c.cnpj && `${rotuloDocumento(c.cnpj)} ${c.cnpj}`, c.telefone, c.cidade && `${c.cidade}/${c.uf}`].filter(Boolean).join(' · ')}
                  </div>
                  <div className="break-all text-xs text-stone-500">
                    {c.email} · conta desde {data.format(new Date(c.criadoEm))}
                  </div>
                </div>
                <div className="text-left md:w-40 md:text-right">
                  {k ? (
                    <>
                      <div className="font-semibold">{formatPriceBRL(k.total)}</div>
                      <div className="text-xs text-stone-500">
                        {k.n} {k.n === 1 ? 'compra' : 'compras'} · última {data.format(new Date(k.ultima))}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-stone-500">Ainda não comprou</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {whats && (
                    <a href={whats} target="_blank" rel="noopener noreferrer" className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white">
                      WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${c.email}`} className="rounded-md border px-3 py-2 text-xs">
                    E-mail
                  </a>
                  {k && (
                    <Link href={`/admin/pedidos?aba=todos&q=${encodeURIComponent(c.email)}`} className="rounded-md border px-3 py-2 text-xs">
                      Pedidos
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminShell>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="text-xs text-stone-500">{rotulo}</div>
      <div className="text-2xl font-semibold">{valor}</div>
    </div>
  );
}
