import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { blingConectado, blingConfigurado } from '@/lib/automacao/bling';
import { statusDasIntegracoes } from '@/lib/admin/status';
import { emProducao, focusConfigurada } from '@/lib/automacao/focus';
import { NotaTeste } from '@/components/admin/NotaTeste';
import { NcmPorCategoria } from '@/components/admin/NcmPorCategoria';
import { categoriasComNcm } from '@/lib/automacao/ncm';
import { NotificacoesCelular } from '@/components/admin/NotificacoesCelular';
import { ResumoAgora } from '@/components/admin/ResumoAgora';
import { aparelhos } from '@/lib/notificar/celular';

export const metadata = { title: 'Integrações · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

/** O que está ligado no site e o que falta, num lugar só. */
export default async function IntegracoesPage({ searchParams }: { searchParams: Promise<{ bling?: string }> }) {
  const { user } = await requireAdmin();
  const { bling: aviso } = await searchParams;
  const itens = await statusDasIntegracoes();
  const categorias = await categoriasComNcm().catch(() => []);
  const ativos = await aparelhos().catch(() => []);
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

        <section className="space-y-3 rounded-lg border bg-white p-4 text-sm">
          <h2 className="font-medium">Notificações e resumos</h2>
          <p className="text-stone-600">
            Cada celular ativado recebe um aviso na tela a cada venda paga e quando um pedido travar. Todo dia, a partir das 20h, chega o
            resumo do dia; na segunda de manhã, o da semana (também por e-mail, se o e-mail da loja estiver configurado).
          </p>
          <NotificacoesCelular />
          <div className="text-stone-600">
            {ativos.length ? (
              <>
                <div className="mb-1 font-medium text-ink">Aparelhos ativados ({ativos.length})</div>
                <ul className="space-y-0.5">
                  {ativos.map((a) => (
                    <li key={a.sub.endpoint}>
                      {a.nome} · {a.email} · desde {new Date(a.desde).toLocaleDateString('pt-BR')}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              'Nenhum aparelho ativado ainda.'
            )}
          </div>
          <ResumoAgora />
        </section>

        <section className="rounded-lg border bg-white p-4 text-sm">
          <div className="font-medium">NCM por categoria (nota fiscal)</div>
          <p className="mt-1 mb-3 text-stone-600">
            O código fiscal do tipo de produto. Cada peça sai na nota com o NCM da categoria dela. Confira na nota de compra do fornecedor
            (coluna NCM) ou com o contador. Comuns: bolsa sintética 4202.22.10 · bolsa de tecido 4202.22.20 · bolsa de couro 4202.21.00 ·
            mochila 4202.92.00.
          </p>
          {categorias.length ? <NcmPorCategoria categorias={categorias} /> : <p className="text-stone-500">Nenhuma categoria cadastrada.</p>}
        </section>

        {focusConfigurada() && (
          <section className="rounded-lg border bg-white p-4 text-sm">
            <div className="font-medium">Nota fiscal · Focus NFe</div>
            {emProducao() ? (
              <p className="mt-1 text-stone-600">Em produção: cada venda paga gera a nota de verdade, sozinha.</p>
            ) : (
              <>
                <p className="mt-1 mb-3 text-stone-600">
                  Modo de teste (homologação). Os pedidos reais ainda não emitem nota. Emita uma nota de teste: se a SEFAZ autorizar, o
                  certificado e os dados fiscais estão certos, e basta mudar <code>FOCUSNFE_AMBIENTE</code> para <code>producao</code> (e
                  trocar o token pelo de produção).
                </p>
                <NotaTeste />
              </>
            )}
          </section>
        )}

        {!focusConfigurada() && (
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
        )}
      </div>
    </AdminShell>
  );
}
