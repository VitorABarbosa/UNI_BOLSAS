import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { blingConectado, blingConfigurado } from '@/lib/automacao/bling';
import { statusDasIntegracoes } from '@/lib/admin/status';

export const metadata = { title: 'Integrações · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

/** O que está ligado no site e o que falta, num lugar só. */
export default async function IntegracoesPage({ searchParams }: { searchParams: Promise<{ bling?: string }> }) {
  const { user } = await requireAdmin();
  const { bling: aviso } = await searchParams;
  const itens = await statusDasIntegracoes();
  const bling = blingConfigurado() ? await blingConectado().catch(() => ({ conectado: false })) : null;

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Integrações">
      <div className="max-w-3xl space-y-4 p-4 md:p-6">
        <p className="text-sm text-stone-600">
          Tudo o que o site usa para vender sozinho. Verde está funcionando; o resto diz o que falta. As chaves ficam nas variáveis da
          Hostinger e nunca aparecem aqui.
        </p>
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.nome} className="flex gap-3 rounded-lg border bg-white p-4 text-sm">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i.ok ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-900'
                }`}
                aria-label={i.ok ? 'Funcionando' : 'Pendente'}
              >
                {i.ok ? '✓' : '!'}
              </span>
              <div>
                <div className="font-medium">{i.nome}</div>
                <div className="text-stone-600">{i.texto}</div>
                {!i.ok && i.falta && <div className="mt-1 text-amber-800">{i.falta}</div>}
              </div>
            </li>
          ))}
        </ul>

        <section className="rounded-lg border bg-white p-4 text-sm">
          <div className="font-medium">Conexão com o Bling (nota fiscal)</div>
          {aviso === 'ok' && <div className="mt-1 text-green-700">Bling conectado com sucesso.</div>}
          {aviso && aviso !== 'ok' && <div className="mt-1 text-red-700">Não deu certo conectar o Bling ({aviso}). Tente de novo.</div>}
          {!bling ? (
            <p className="mt-1 text-stone-600">Primeiro coloque BLING_CLIENT_ID e BLING_CLIENT_SECRET nas variáveis da Hostinger.</p>
          ) : (
            <a href="/api/bling/conectar" className="mt-3 inline-block rounded-md bg-stone-900 px-4 py-2 text-xs font-medium text-white">
              {bling.conectado ? 'Reconectar Bling' : 'Conectar Bling'}
            </a>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
