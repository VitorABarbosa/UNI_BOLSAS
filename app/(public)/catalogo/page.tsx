import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { listActiveProducts } from '@/lib/queries/products';
import { listCategories } from '@/lib/queries/categories';
import { cardCoverImage } from '@/lib/product-images';
import { productPrice } from '@/lib/product-price';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { codigoPeca } from '@/lib/pedido';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { STORE } from '@/lib/content/store';
import { WHATSAPP_NUMBER } from '@/lib/tokens';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
import { CatalogoAcoes } from '@/components/public/catalogo/CatalogoAcoes';
import type { CatalogoPdf } from '@/lib/catalogo-pdf';

type Busca = { precos?: string; categoria?: string };

/**
 * Categorias que abrem o PDF baixado, nesta ordem — as que a loja quer em
 * destaque no material que a lojista guarda e repassa. Só o PDF muda: o site
 * e a página /catalogo seguem a ordem das categorias do painel.
 *
 * Reconhece pelo identificador ou pelo nome, sem acento e sem diferenciar
 * maiúsculas: renomear "Esportivas" pra "Bolsas esportivas" no painel não
 * tira a categoria da frente.
 */
const PRIMEIRO_NO_PDF = ['esportiv'];

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Posição da categoria no começo do PDF, ou -1 se ela segue a ordem normal. */
function prioridadeNoPdf(c: { slug: string; label: string }): number {
  const texto = `${semAcento(c.slug)} ${semAcento(c.label)}`;
  return PRIMEIRO_NO_PDF.findIndex((termo) => texto.includes(termo));
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}): Promise<Metadata> {
  const { precos } = await searchParams;
  return {
    title: `Catálogo de atacado — ${SITE_NAME}`,
    description: `Todas as bolsas, mochilas e malas da ${SITE_NAME} numa página só, com preço de atacado. Compre pelo site a partir de ${PEDIDO_MINIMO} peças ou salve em PDF.`,
    alternates: { canonical: `${SITE_URL}/catalogo` },
    // A versão sem preços é da lojista pras clientes dela: não é página pra
    // aparecer no Google.
    robots: precos === 'nao' ? { index: false, follow: false } : undefined,
  };
}

/** "5511988063432" -> "(11) 98806-3432" */
function telefoneLegivel(n: string): string {
  const local = n.replace(/^55/, '');
  return `(${local.slice(0, 2)}) ${local.slice(2, local.length - 4)}-${local.slice(-4)}`;
}


/**
 * O catálogo pra compartilhar.
 *
 * Uma página limpa, com todas as peças agrupadas por categoria, que a lojista
 * manda por link ou salva em PDF (a impressão do navegador usa o CSS de
 * impressão daqui). Dois modos, pela URL:
 *
 * - normal: com preços, código e link de cada peça — pra quem compra da gente;
 * - `?precos=nao`: sem preços, sem links e sem nosso contato — pra lojista
 *   mandar às clientes DELA sem expor o preço de atacado nem o fornecedor.
 *   Nesse modo a página também esconde o menu e o rodapé do site, e não
 *   oferece o botão de voltar aos preços: a cliente da lojista abre o link e
 *   não tem um clique entre ela e o preço de atacado.
 *
 * `?categoria=<slug>` recorta uma categoria só.
 *
 * Os modos vêm da URL lida no servidor, e não de um botão que esconde preço
 * depois de carregar: assim quem abre o link "sem preços" nunca vê o preço,
 * nem por um instante.
 */
export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const busca = await searchParams;
  const comPrecos = busca.precos !== 'nao';
  const [products, categorias] = await Promise.all([
    listActiveProducts(),
    listCategories(),
  ]);
  const recorte = categorias.find((c) => c.slug === busca.categoria) ?? null;

  const grupos = categorias
    .filter((c) => !recorte || c.id === recorte.id)
    .map((c) => ({
      categoria: c,
      pecas: products.filter((p) => p.category_id === c.id),
    }))
    .filter((g) => g.pecas.length > 0);

  const totalPecas = grupos.reduce((n, g) => n + g.pecas.length, 0);
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const titulo = `${recorte ? recorte.label : 'Catálogo'}${comPrecos ? ' de atacado' : ''}`;
  const subtitulo = `${totalPecas} ${totalPecas === 1 ? 'modelo' : 'modelos'} · atualizado em ${hoje}`;
  const dominio = SITE_URL.replace(/^https?:\/\//, '');
  const rodape = `Venda só no atacado, a partir de ${PEDIDO_MINIMO} peças. Pedidos pelo WhatsApp ${telefoneLegivel(WHATSAPP_NUMBER)} ou em ${dominio}. Preços sujeitos a alteração; disponibilidade confirmada no pedido.`;

  /*
   * O mesmo conteúdo da página, no formato do PDF gerado no aparelho. Sai
   * daqui, já filtrado pelo modo: no "sem preços" os campos de preço, código
   * e link nem chegam ao navegador.
   */
  const pdf: CatalogoPdf = {
    titulo,
    subtitulo,
    dados: comPrecos
      ? [
          ['Pedido mínimo', `${PEDIDO_MINIMO} peças`],
          ['WhatsApp', telefoneLegivel(WHATSAPP_NUMBER)],
          ['Loja', `${STORE.name}, ${STORE.unitText} · ${STORE.street}, ${STORE.district}`],
        ]
      : null,
    rodape: comPrecos ? rodape : null,
    contato: comPrecos
      ? `Atacado a partir de ${PEDIDO_MINIMO} peças · WhatsApp ${telefoneLegivel(WHATSAPP_NUMBER)} · ${dominio}`
      : null,
    capa: '/hero/slide-1.jpg',
    grupos: [...grupos]
      .sort((a, b) => {
        // As de destaque na frente; o resto na ordem do painel (o sort é
        // estável, então empate mantém a ordem original).
        const pa = prioridadeNoPdf(a.categoria);
        const pb = prioridadeNoPdf(b.categoria);
        if (pa === pb) return 0;
        if (pa === -1) return 1;
        if (pb === -1) return -1;
        return pa - pb;
      })
      .map(({ categoria, pecas }) => ({
        categoria: categoria.label,
        pecas: pecas.map((p) => {
          const capa = cardCoverImage(p, p.colors[0] ?? null);
          const preco = productPrice(p);
          return {
            nome: p.name,
            preco: comPrecos ? preco.currentLabel : null,
            precoDe: comPrecos ? preco.originalLabel : null,
            cores: p.colors.map((c) => ({
              nome: c.name,
              hex: c.hex,
              destaque: c.accent_hex,
            })),
            tamanhos: p.sizes && p.sizes.length > 1 ? p.sizes : [],
            codigo: comPrecos ? codigoPeca(p.id) : null,
            link: comPrecos ? `${dominio}/p/${codigoPeca(p.id)}` : null,
            foto: capa ? publicImageUrl(capa.storage_path) : null,
          };
        }),
      })),
  };

  return (
    <div className={'uni-cat-doc' + (comPrecos ? '' : ' is-revenda')}>
      <div className="uni-container">
        <header className="uni-cat-doc-capa">
          <div className="uni-cat-doc-marca">
            <Image
              src="/LOGO_UNI_BOLSAS_PNG.png"
              alt=""
              width={44}
              height={44}
              className="uni-cat-doc-logo"
            />
            <span>{SITE_NAME}</span>
          </div>
          <h1 className="uni-cat-doc-titulo">
            {recorte ? recorte.label : 'Catálogo'}
            {comPrecos && <span> de atacado</span>}
          </h1>
          <p className="uni-cat-doc-sub">{subtitulo}</p>
          {comPrecos && (
            <dl className="uni-cat-doc-dados">
              <div>
                <dt>Pedido mínimo</dt>
                <dd>{PEDIDO_MINIMO} peças</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{telefoneLegivel(WHATSAPP_NUMBER)}</dd>
              </div>
              <div>
                <dt>Loja</dt>
                <dd>
                  {STORE.name}, {STORE.unitText} · {STORE.street},{' '}
                  {STORE.district}
                </dd>
              </div>
            </dl>
          )}
        </header>

        <CatalogoAcoes
          // Outro modo ou categoria = outro PDF: o aviso de "PDF pronto" não
          // pode sobrar do anterior.
          key={`${comPrecos}-${recorte?.slug ?? ''}`}
          comPrecos={comPrecos}
          categoria={recorte?.slug ?? ''}
          categorias={categorias.map((c) => ({ slug: c.slug, label: c.label }))}
          pdf={pdf}
        />

        {grupos.map(({ categoria, pecas }) => (
          <section key={categoria.id} className="uni-cat-doc-grupo">
            <h2>
              {categoria.label}
              <span>{pecas.length}</span>
            </h2>
            <ul className="uni-cat-doc-grade">
              {pecas.map((p) => {
                const capa = cardCoverImage(p, p.colors[0] ?? null);
                const preco = productPrice(p);
                const conteudo = (
                  <>
                    <div className="uni-cat-doc-foto">
                      {capa && (
                        <Image
                          src={publicImageUrl(capa.storage_path)}
                          alt={capa.alt}
                          fill
                          sizes="(max-width: 600px) 46vw, (max-width: 1080px) 30vw, 300px"
                        />
                      )}
                    </div>
                    <div className="uni-cat-doc-info">
                      <h3>{p.name}</h3>
                      {comPrecos && (
                        <p className="uni-cat-doc-preco">
                          {preco.currentLabel}
                          {preco.originalLabel && <s>{preco.originalLabel}</s>}
                        </p>
                      )}
                      {p.colors.length > 0 && (
                        <p className="uni-cat-doc-cores">
                          {p.colors.map((c) => c.name).join(', ')}
                        </p>
                      )}
                      {p.sizes && p.sizes.length > 1 && (
                        <p className="uni-cat-doc-cores">
                          Tamanhos {p.sizes.join(', ')}
                        </p>
                      )}
                      {comPrecos && (
                        <p className="uni-cat-doc-cod">
                          Cód. {codigoPeca(p.id)}
                          <span className="uni-cat-doc-link">
                            {' '}
                            · {SITE_URL.replace(/^https?:\/\//, '')}/p/{codigoPeca(p.id)}
                          </span>
                        </p>
                      )}
                    </div>
                  </>
                );
                return (
                  <li key={p.id} className="uni-cat-doc-peca">
                    {comPrecos ? (
                      <Link href={`/produtos/${p.slug}`}>{conteudo}</Link>
                    ) : (
                      conteudo
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {comPrecos && (
          <footer className="uni-cat-doc-rodape">{rodape}</footer>
        )}
      </div>
    </div>
  );
}
