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
7. **Shopee** (`/admin/shopee`): conectar/desconectar a loja, sincronizar e importar os anúncios da Shopee como produtos do site (ver seção abaixo).

Mudanças refletem no site público em ≤5s via `revalidatePath` específico (a home, o sitemap, e cada PDP afetado).

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
- [x] **Integração Shopee (Shopee → catálogo):** OAuth da loja, mirror em `shopee_items`, importação do item como produto (fotos incluídas), preço sempre sincronizado, painel `/admin/shopee` e cron diário
- [ ] **Plano 04 — Deploy + cleanup:** Vercel, custom domain, smoke em produção, remoção da reference, polish (loading states, OG fonts)

A spec viva está em `docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md`.
