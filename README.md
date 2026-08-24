# Uni Bolsas

Catálogo da Uni Bolsas — fabricante de bolsas no Brás · São Paulo. Atendimento atacado e varejo via WhatsApp; este repositório hospeda o site público + um painel admin para CRUD de produtos.

> **Reference design:** a pasta `Claude Design - Reference/` contém o protótipo original entregue pelo Claude Design (HTML único + JSX via Babel UMD). Ela é fonte de verdade visual durante toda a migração e fica preservada **até a Fase 8**, quando é apagada.

## Stack

Next.js 16 (App Router) · TypeScript estrito · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + Storage) · pnpm.

## Setup local em 4 passos

1. **Instalar deps** (Node 20+, pnpm 11+):
   ```powershell
   pnpm install
   ```

2. **Copiar envs:**
   ```powershell
   cp .env.example .env.local
   ```
   Preencher `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Settings → API no dashboard do projeto).

3. **Aplicar schema + seed:** o schema vive em `supabase/migrations/` e foi aplicado via MCP no projeto remoto. Para popular o catálogo:
   ```powershell
   pnpm seed
   ```

4. **Subir o servidor de dev:**
   ```powershell
   pnpm dev
   ```
   Abre em `http://localhost:3000`.

## Scripts úteis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento Next.js |
| `pnpm build` | Build de produção |
| `pnpm start` | Serve o build de produção |
| `pnpm typecheck` | `tsc --noEmit` (TS estrito) |
| `pnpm lint` | ESLint flat config |
| `pnpm db:types` | Regera `types/db.ts` do schema remoto via supabase CLI (precisa `supabase login` antes) |
| `pnpm seed` | Limpa e re-popula DB + Storage com os 5 produtos da referência |
| `pnpm smoke` | Fetch ponta-a-ponta via anon key (verifica RLS pública + nested relations) |
| `pnpm images:optimize` | Rede de segurança: reencoda imagens de `public/hero` acima de 3840px ou 8MB. Não precisa rodar a cada troca de foto |

## Imagens e mobile

O site público serve **todas** as imagens por `next/image` (variantes responsivas,
WebP/AVIF, lazy loading). Duas regras ao mexer nelas:

1. **Os masters em `public/` podem ficar em alta resolução.** Quem entrega a
   imagem ao navegador é o `next/image`, que serve WebP/AVIF no tamanho da
   tela — um JPEG de 5 MB no repositório vira ~30 KB no celular. Manter o
   master grande melhora a nitidez em telas retina e não pesa a página.
   `pnpm images:optimize` é só uma rede de segurança para arquivos acima de
   3840px ou 8 MB, que fazem o otimizador consumir memória à toa.
2. **`next/image` com `fill` exige `position: relative` no container.** Sem isso
   a foto escapa do bloco e cobre a página inteira.

O CSS responsivo tem **uma fonte única de verdade**: o bloco no fim de
`app/globals.css`, fora do `@layer components` (CSS sem layer vence CSS com
layer, então ele ganha do desktop sem `!important`). Não duplicar essas regras
dentro do `@layer` — era assim antes, com duas cópias do bloco mobile, e editar
só uma delas dava a impressão de que a mudança não pegava.

As famílias tipográficas vêm dos tokens `--font-sans` / `--font-serif` /
`--font-mono`, que apontam pras variáveis geradas pelo `next/font` em
`app/layout.tsx`. Escrever `font-family: 'DM Sans'` direto **não funciona**: o
`next/font` registra a fonte com um nome com hash, e o nome literal cai no
fallback do sistema.

## Promoções

`products` tem dois campos de promoção, aplicados pela migration
`20260824000000_product_promo.sql`:

| campo | papel |
|---|---|
| `price_retail` | preço cheio — o "de" riscado quando há promoção |
| `price_promo` | preço vigente — o "por". NULL = sem promoção |
| `promo_ends_at` | fim opcional. Passada a data, o site volta sozinho ao cheio |

A promoção está ativa quando `price_promo` existe, é menor que `price_retail`
e o prazo não passou — regra única em `lib/product-price.ts`, usada por card,
quick view, PDP e pela mensagem do WhatsApp. Como as páginas revalidam a cada
minuto, promoção vencida some sem ninguém precisar apagar o campo.

No admin dá pra aplicar produto a produto (aba Preços) ou em massa: selecione
as linhas na lista e use a barra que aparece (desconto percentual, preço fixo,
remover promoção, publicar/despublicar, mover de categoria).

**Shopee:** o sync trata `original_price` como preço cheio e `price` como
promocional. Enquanto a loja estiver conectada, as promoções da Shopee viram
"de/por" no site sozinhas, todo dia, pelo cron.

## Cadastrar um admin

```powershell
$env:ADMIN_EMAIL = 'novo@admin.com'
$env:ADMIN_PASSWORD = 'senha-forte'
pnpm tsx scripts/create-admin.ts
```

Cria o usuário em `auth.users` (já confirmado) e adiciona em `public.admins`. Idempotente — se o email já existe, apenas garante a entrada em `admins`.

Alternativa manual: Studio → Authentication → Users → Add user (com `Auto Confirm: ON`) → SQL Editor → `insert into public.admins (user_id) values ('<UUID>');`

### Habilitar o Auth Hook (uma vez por projeto)

O proxy lê a claim `is_admin` direto do JWT (zero roundtrip ao DB). A claim é injetada por uma função SQL (`public.custom_access_token_hook`, criada no Plano 03), mas a função só é executada se o hook estiver habilitado no Studio:

> Studio → **Authentication → Hooks** → **Customize Access Token (CAT) Claim** → schema=`public`, function=`custom_access_token_hook`, status=**Enabled** → Save.

Sem isso, o login até funciona, mas o proxy redireciona com `?error=unauthorized` porque a claim nunca chega. Após habilitar, faça logout/login do admin uma vez para o JWT renovar.

## Como usar o admin

1. Acesse `/admin/login` e entre com o email/senha do admin (criado pelo `pnpm tsx scripts/create-admin.ts`).
2. **Dashboard** (`/admin`): contadores de produtos ativos, categorias e imagens, mais os 5 produtos editados mais recentemente.
3. **Produtos** (`/admin/produtos`): listagem com search, filtro por categoria, toggle de ativos, sort. Botão **Novo produto** abre o form em `/admin/produtos/novo`.
4. **Editar produto** (`/admin/produtos/[id]`): tabs Básico / Preço / Detalhes / SEO / Cores / Imagens. Cores e Imagens persistem **independentemente** (cada mudança grava na hora). Os outros tabs gravam só ao clicar em **Salvar** no rodapé.
5. **Imagens**: drag-and-drop até 4 paralelos, 5MB por arquivo, formatos webp/jpg/png/svg. Cada cor cria uma tab própria + tab "Genéricas" sempre presente. Reorder por drag, click na thumb edita o `alt`.
6. **Categorias** (`/admin/categorias`): tabela inline editável com reorder por drag e add inline no fim. Delete cascade com confirm que mostra quantos produtos serão apagados junto.
7. **Importar planilha** (`/admin/importar`): sobe o `.xlsx`/`.csv` exportado da Shopee e cria os produtos (ver seção abaixo).
8. **Shopee** (`/admin/shopee`): conectar/desconectar a loja, sincronizar e importar os anúncios da Shopee como produtos do site (ver seção abaixo).

Mudanças refletem no site público em ≤5s via `revalidatePath` específico (a home, o sitemap, e cada PDP afetado).

## Importar produtos por planilha

Caminho mais curto para trazer o catálogo da Shopee sem depender da API:
`/admin/importar`. Não precisa de app aprovado, chave, migration nem variável
de ambiente — só estar logado no admin.

### Com o export do Seller Center (caminho principal)

No Seller Center: **Produtos → Editar em Massa → Baixar**, e gere os três
modelos (deixe os filtros em "Todos"):

| Modelo | O que traz |
|---|---|
| Informações básicas | nome e descrição |
| Informações de Mídia | categoria da Shopee, foto de capa + até 8 fotos, e a foto de cada cor |
| Informações de vendas | uma linha por variação, com preço e estoque |

Em `/admin/importar`, selecione **os três de uma vez**. O leitor reconhece cada
template pelo marcador interno (linha 2 da planilha), junta tudo pelo *ID do
Produto* e mostra um resumo antes de criar qualquer coisa: quantos produtos,
quantas fotos, quantos têm cor, quantos já existem no site.

O que cada produto recebe:

- **nome e descrição** do anúncio;
- **preço** = a variação mais barata (o site mostra "a partir de");
- **fotos** baixadas para o nosso Storage (nunca hotlink do CDN da Shopee);
- **cores**: as variações que são realmente cor viram swatch, com a foto
  daquela cor quando a Shopee tem uma. O hex vem de um vocabulário em
  `lib/import/color-map.ts`; variação que não é cor (`kit com 2`, `01`, `02`)
  é ignorada e aparece no relatório;
- **tamanho**, quando o vendedor empacotou os dois no mesmo campo
  (`Preto,grande`).

A importação anda em **blocos de 5 produtos** com barra de progresso: um
catálogo de 200 itens significa ~800 downloads de foto, muito além do que uma
requisição aguenta. Nomes repetidos são descartados, e por padrão produtos que
já existem no site são pulados.

### Com qualquer outra planilha

Se o arquivo não for um export da Shopee, a tela cai no modo genérico: você
escolhe quais colunas são nome, descrição, preço e fotos, vê a prévia e
importa. Aceita `.xlsx` e `.csv` (com `;` ou `,`), até 500 linhas.

### Detalhes que evitam surpresa

- **Formato das fotos** é detectado pelos bytes do arquivo, não pelo
  `content-type` nem pela extensão — as URLs da Shopee não têm extensão.
- **Preço** aceita `R$ 189,90`, `1.234,56` e `89.90`.
- Foto que falhar no download é pulada com aviso no relatório, sem derrubar a
  importação.
- Depois de importar, revise em `/admin/produtos`: os textos da Shopee vêm
  cheios de palavra-chave, e as cores que não foram reconhecidas precisam ser
  cadastradas à mão.

## Integração Shopee (Shopee → catálogo do site)

A Shopee é usada como **fonte do catálogo**: o que está listado lá vira produto
aqui — com nome, descrição, preço e as fotos copiadas para o nosso Storage. A
venda continua sendo pelo WhatsApp, como no resto do site; **não há botão de
comprar na Shopee**, porque o site é vitrine.

**1. Criar o app na Shopee.** Em [open.shopee.com](https://open.shopee.com),
com CNPJ ativo, crie o app e anote `partner_id` + `partner_key` (Console App →
App Detail). Cadastre o redirect `https://unibolsas.store/api/shopee/callback`
(e o de `localhost` para testar).

**2. Preencher as envs** (`.env.local` e Vercel → Settings → Environment
Variables): `SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`, `SHOPEE_REGION=br`,
`CRON_SECRET`. Ver `.env.example`.

**3. Aplicar as migrations** `20260822000000_shopee_integration.sql` e
`20260822000001_shopee_import.sql`, depois regerar os tipos com `pnpm db:types`.

**4. Conectar a loja.** `/admin/shopee` → **Conectar loja Shopee** → autorizar
com a conta vendedora. O callback grava o par de tokens.

**5. Importar.** Escolha a **categoria dos importados**, clique em
**Sincronizar agora** e depois em **Importar pendentes** (ou importe item a
item). Ligando **Importar itens novos automaticamente**, o cron diário passa a
criar sozinho os produtos que aparecerem na Shopee — até 25 por execução.

### O que a importação faz (e o que não faz)

| Campo | De onde vem |
|---|---|
| Nome, descrição | Do anúncio da Shopee |
| Preço de varejo | Do anúncio, e **continua sincronizado** a cada sync |
| Fotos | Baixadas do CDN da Shopee para o bucket `products` (até 9, 5MB cada) |
| Slug, ordem | Gerados aqui (slug único a partir do nome) |
| Categoria | A escolhida no painel |
| **Cores e tamanhos** | **Não importados** — a Shopee não dá o hex das cores e as variações não mapeiam 1:1 nos nossos `sizes`. Preencher no form do produto. |

Itens que somem da Shopee (despublicados, banidos) são marcados como
`GONE` no painel, mas **o produto continua ativo no site** — vocês seguem
vendendo por WhatsApp. Desconectar a loja também não apaga nada do catálogo:
só interrompe a atualização de preço e a entrada de novidades.

Um item também pode ser vinculado a um produto que já existia (em vez de criar
outro): automaticamente quando os nomes batem, ou pelo select da tabela. A
relação é 1:1.

## Layout do projeto

```
app/
  layout.tsx                       # html, fontes, metadata, metadataBase
  globals.css                      # Tailwind v4 + tokens + 1500+ linhas de uni-* @layer components
  robots.ts                        # /robots.txt
  sitemap.ts                       # /sitemap.xml (landing + 5 PDPs)
  api/shopee/
    authorize/route.ts             # redirect p/ a tela de autorização da Shopee
    callback/route.ts              # troca o code pelo par de tokens
    sync/route.ts                  # cron diário (Bearer CRON_SECRET)
  (public)/
    layout.tsx                     # casca: PromoStrip, Header, Footer, FloatingWA
    page.tsx                       # landing single-page (RSC + ISR 60s)
    produtos/[slug]/
      page.tsx                     # PDP (SSG via generateStaticParams)
      opengraph-image.tsx          # OG PNG 1200x630 dinâmico
components/
  public/
    icons/                         # 12 SVG icons (port da reference)
    primitives/                    # Reveal, CountUp, WhatsAppButton, Logo
    shell/                         # PromoStrip, Header, MobileMenu, Footer, FloatingWA
    home/
      Hero, HeroCarousel, CredibilityStrip, WholesaleVsRetail   # HeroCarousel consome lib/content/hero-slides.ts
      Catalog/                     # orchestrator + filters + grid + card
      Manifesto, ManifestoIllustrations
      Social                         # consome lib/content/instagram.ts + thumbnails de public/instagram/
      FAQSection, Location, MapEmbed, Newsletter
      HomeContent                  # client wrapper que mantém o state do QuickView
    quickview/QuickView            # modal de detalhes
    pdp/                           # PdpContent, Gallery, ProductInfo, ColorSwatches,
                                   # SizePicker, PdpWhatsAppCTA, RelatedProducts
  ui/                              # primitivas shadcn (Plano 03 vai consumir)
lib/
  tokens.ts                        # paleta TS (espelha CSS vars)
  utils.ts                         # cn()
  format.ts                        # truncate, formatPriceBRL
  seo.ts                           # SITE_URL, SITE_NAME
  whatsapp.ts                      # waLink, waProduct, waGeneral, waWholesale, waRetail, waNewsletter
  product-images.ts                # galleryImages, cardCoverImage, productHasColor
  catalog/create-product.ts        # cria produto + copia fotos (usado pelos 2 importadores)
  import/                          # sheet.ts (.xlsx/.csv genérico), shopee-export.ts
                                   # (templates do Seller Center), color-map.ts, columns.ts
  shopee/                          # server-only: config, assinatura HMAC, tokens,
                                   # catalog.ts (leitura), import.ts (item -> produto)
                                   # e sync.ts (orquestra tudo)
  content/                         # FAQ, TIMELINE, TESTIMONIALS, STORE, CREDIBILITY, PROMO, COLOR_PALETTE
  queries/                         # listActiveProducts, getProductBySlug, listRelatedProducts, listProductSlugs
  supabase/
    client.ts                      # createBrowserClient
    server.ts                      # createServerClient (cookie-bound RSC)
    anon.ts                        # stateless anon client (build-time queries)
    admin.ts                       # service-role, server-only
    image-url.ts                   # publicImageUrl(storage_path)
types/
  db.ts                            # gerado de supabase gen types
scripts/
  seed.ts                          # popula DB + Storage
  test-fetch.ts                    # smoke
  create-admin.ts                  # cria auth user + admins row
  port-styles.py                   # one-shot: porta styles.jsx -> globals.css
supabase/
  config.toml
  migrations/                      # SQL versionado
  seed-assets/images.ts            # geradores de SVG
Claude Design - Reference/         # protótipo original (preservado até Fase 8)
docs/superpowers/                  # plans + specs da migração
```

## Roadmap

- [x] **Plano 01 — Foundation:** scaffold Next.js + Tailwind + shadcn, projeto Supabase, schema com RLS, Storage com policies, seed dos 5 produtos, smoke test, primeiro admin
- [x] **Plano 02 — Public site:** landing single-page, PDP `/produtos/[slug]`, sitemap, robots, OG images dinâmicas
- [x] **Plano 03 — Admin:** auth via JWT claim `is_admin`, shell admin, CRUD de produtos com upload drag-and-drop e editor de cores, CRUD de categorias com cascade delete
- [x] **Importador de planilha:** `/admin/importar` — export do Seller Center (básicas + mídia + vendas) → produtos com fotos e cores, sem depender da API
- [x] **Integração Shopee (Shopee → catálogo):** OAuth da loja, mirror em `shopee_items`, importação do item como produto (fotos incluídas), preço sempre sincronizado, painel `/admin/shopee` e cron diário
- [ ] **Plano 04 — Deploy + cleanup:** Vercel, custom domain, smoke em produção, remoção da reference, polish (loading states, OG fonts)

A spec viva está em `docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md`.
