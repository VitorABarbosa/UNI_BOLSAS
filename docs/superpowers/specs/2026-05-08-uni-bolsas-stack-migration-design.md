# Uni Bolsas — Migração de Stack (Design Spec)

**Data:** 2026-05-08
**Status:** Aprovado para plano de implementação
**Autor:** Claude (em colaboração com Vitor)

---

## 1. Contexto e Problema

A Uni Bolsas é uma fabricante de bolsas (Brás/SP) que vende em lotes para lojistas (atacado) e para consumidor final (varejo). O objetivo atual do site é apresentação de produtos com fluxo de venda via WhatsApp — não há carrinho/checkout.

O design visual atual foi entregue pelo Claude Design e está versionado em `Claude Design - Reference/Uni Bolsas/`. Ele tem qualidade visual madura, mas a "stack" usada é inadequada para produção:

- HTML único (`Uni Bolsas v2.html`) que carrega React 18 via UMD + Babel-Standalone (compilação de JSX no navegador a cada page load)
- ~12 arquivos `.jsx` soltos em escopo global (`window.PRODUCTS = ...`), sem bundler, sem módulos ES, sem tipagem
- Dados (5 produtos com variantes, FAQ, depoimentos, timeline, info da loja) hardcoded em `js/data.jsx`
- Imagens referenciadas via objeto `IMG.matelasse_preto` carregado de `js/images.js`
- Sem SEO real (single page, sem metadata por produto, sem sitemap)
- Sem painel administrativo — qualquer alteração de produto exige editar código

**Objetivos da migração:**
1. Estrutura de produção real (build, otimização, deploy)
2. Páginas individuais por produto para SEO
3. Painel admin com CRUD de produtos (incluindo variantes de cor, imagens com upload)
4. Banco de dados real (substituindo arrays hardcoded de produtos)
5. Preservar 100% o design visual do Claude Design Reference
6. Organização modular com arquivos pequenos e responsabilidades únicas

---

## 2. Stack Escolhida

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript estrito** | RSC para SEO, Server Actions para CRUD, Image optimization built-in, ISR para cache eficiente |
| Estilo | **Tailwind CSS + shadcn/ui** | Tailwind no público com tokens do design mapeados em `theme.extend`; shadcn/ui no admin (formulários, tabelas, dialogs acessíveis) |
| Backend / dados | **Supabase** (Postgres + Auth + Storage) | BaaS gerenciado: banco relacional, login do admin, upload de imagens, RLS, free tier suficiente |
| Imagens | **Supabase Storage + `next/image`** | Upload pelo admin, otimização AVIF/WebP automática no público |
| Auth | **Supabase Auth** (email/senha) + middleware Next.js | Tabela `admins` com `user_id` define quem tem acesso ao painel |
| Deploy | **Vercel** | Zero config para Next.js, env vars, preview por branch, free tier |
| Pacotes | **pnpm** | Lockfile determinístico, instalação rápida |
| TypeScript | **`strict: true` + `noUncheckedIndexedAccess`** | Tipagem ponta-a-ponta com types gerados via `supabase gen types` |

**Convenção de nomenclatura:** padrão idiomático Next.js (kebab-case para rotas e arquivos, PascalCase para componentes React, camelCase para utils).

---

## 3. Escopo

### 3.1 Site público

- **Landing single-page** (`/`) preservando o design atual: PromoStrip, Header, Hero, CredibilityStrip, WholesaleVsRetail, Catalog (com filtros de categoria e cor + QuickView modal), Manifesto, Social, FAQSection, Location, Newsletter, Footer, FloatingWA
- **Páginas individuais por produto** (`/produtos/[slug]`) com galeria, troca de cor, copy completa, CTAs de WhatsApp e SEO meta editável
- **`/sitemap.xml` e `/robots.txt`** dinâmicos
- **Idioma:** apenas pt-BR
- **Venda:** continua 100% via WhatsApp (não há carrinho/checkout)

### 3.2 Painel admin (v1)

- **CRUD completo de produtos**: nome, slug, tagline, descrição, categoria, badge, preço varejo (numérico), preço atacado (texto livre), dimensões, peso, material, sizes (array), ativo/inativo, sort_order, SEO title/description
- **CRUD de variantes de cor** por produto: nome, hex, accent_hex (bicolor), reorder
- **CRUD de imagens** por produto: upload múltiplo drag-and-drop, vinculação a uma cor específica OU "genérica", reorder por escopo (dentro de cada cor e dentro das genéricas separadamente), alt text
- **CRUD de categorias**: editar label, reorder, criar nova; bloqueia delete se houver produtos vinculados
- **Login**: email/senha. Cadastro de admins é **manual via Supabase Studio** (sem fluxo de convite no v1)
- **Hard delete** com confirmação modal (sem soft delete)

### 3.3 Conteúdo estático em código (não vai para o banco no v1)

Estes ficam em `lib/content/*.ts` versionados em git:
- FAQ
- Depoimentos (testimonials)
- Timeline
- Informações da loja (endereço, horários, redes sociais, mapas)
- Copy do Manifesto e Hero

**Justificativa:** mudam raramente, não justificam o custo de implementar UI de edição no admin v1.

---

## 4. Modelagem de Dados

### 4.1 Schema (Postgres)

```sql
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,            -- "bolsas", "mochilas", usado em filtros/URLs futuras
  label       text not null,                   -- "Bolsas", "Mochilas"
  sort_order  int  not null default 0
);

create table products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  tagline           text,
  description       text,
  category_id       uuid references categories(id) not null,
  badge             text,
  price_retail      numeric(10,2) not null,
  price_wholesale   text,
  dimensions        text,
  weight            text,
  material          text,
  sizes             text[] not null default '{Único}',
  active            boolean not null default true,
  sort_order        int not null default 0,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on products (category_id);
create index on products (active, sort_order);

create table product_colors (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  name        text not null,
  hex         text not null,
  accent_hex  text,
  sort_order  int  not null default 0
);
create index on product_colors (product_id, sort_order);

create table product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  color_id      uuid     references product_colors(id) on delete cascade,
  storage_path  text not null,
  alt           text,
  sort_order    int  not null default 0
);
create index on product_images (product_id, color_id, sort_order);

create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
```

### 4.2 Decisões de modelagem

- **`price_wholesale` é text** porque o conteúdo atual é de marketing ("A partir de R$ 65 · 10un+"), não cálculo. Se virar regra de negócio, evolui para tabela `wholesale_tiers` separada.
- **`sizes` é `text[]`** — simples, ordenado, editado como tags. Não justifica tabela própria.
- **`product_images.color_id` é nullable** — `NULL` significa "imagem genérica do produto" (válida para qualquer cor).
- **`categories` é tabela com uuid PK + slug separado** (não enum, não text PK) porque o admin precisa criar/editar e renomear sem implicar em cascata de mudança de chave estrangeira. O `slug` é gerado a partir do label na criação e pode ser editado manualmente no admin.
- **`admins` é tabela** (não claim no JWT) — mais explícito, fácil de auditar e revogar.

### 4.3 Row Level Security (RLS)

| Tabela | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `categories` | público (`using true`) | só admins (`auth.uid() in (select user_id from admins)`) |
| `products` | público | só admins |
| `product_colors` | público | só admins |
| `product_images` | público | só admins |
| `admins` | só service role | só service role (gerenciado via Supabase Studio) |

### 4.4 Storage

- Bucket público `products`
- Política de upload: só admins (mesma checagem da tabela `admins`)
- Path: `products/{product_id}/{uuid}.{ext}`
- Tamanho máx: 5MB
- Tipos aceitos: webp, jpeg, png

---

## 5. Estrutura de Pastas

```
uni-bolsas/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx                     # Header + Footer + PromoStrip + FloatingWA
│   │   ├── page.tsx                       # landing single-page
│   │   ├── produtos/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx               # PDP — RSC + generateStaticParams + ISR
│   │   │       └── opengraph-image.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── admin/
│   │   ├── layout.tsx                     # AdminShell
│   │   ├── page.tsx                       # dashboard com counts
│   │   ├── login/page.tsx
│   │   ├── produtos/
│   │   │   ├── page.tsx                   # listagem
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── categorias/page.tsx
│   │   └── _actions/                      # Server Actions
│   │       ├── products.ts
│   │       ├── colors.ts
│   │       ├── images.ts
│   │       └── categories.ts
│   ├── api/revalidate/route.ts            # webhook opcional
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── public/
│   │   ├── Header.tsx
│   │   ├── PromoStrip.tsx
│   │   ├── Hero.tsx
│   │   ├── CredibilityStrip.tsx
│   │   ├── WholesaleVsRetail.tsx
│   │   ├── Catalog/
│   │   │   ├── index.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   └── ColorFilter.tsx
│   │   ├── QuickView.tsx
│   │   ├── Manifesto.tsx
│   │   ├── Social.tsx
│   │   ├── FAQSection.tsx
│   │   ├── Location.tsx
│   │   ├── Newsletter.tsx
│   │   ├── Footer.tsx
│   │   ├── FloatingWA.tsx
│   │   ├── MobileMenu.tsx
│   │   └── pdp/
│   │       ├── Gallery.tsx
│   │       ├── ColorSwatches.tsx
│   │       ├── SizePicker.tsx
│   │       └── PdpWhatsAppCTA.tsx
│   ├── admin/
│   │   ├── AdminShell/
│   │   ├── ProductForm/
│   │   │   ├── index.tsx
│   │   │   ├── BasicFields.tsx
│   │   │   ├── DimensionsFields.tsx
│   │   │   ├── ColorsEditor.tsx
│   │   │   ├── ImagesEditor.tsx
│   │   │   └── SeoFields.tsx
│   │   ├── ProductsTable.tsx
│   │   ├── CategoriesEditor.tsx
│   │   └── AuthForm.tsx
│   └── ui/                                # shadcn primitives
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # createBrowserClient
│   │   ├── server.ts                      # createServerClient (RSC + actions)
│   │   └── admin.ts                       # service-role (server-only)
│   ├── auth/
│   │   ├── require-admin.ts
│   │   └── middleware.ts
│   ├── content/
│   │   ├── faq.ts
│   │   ├── testimonials.ts
│   │   ├── timeline.ts
│   │   ├── store.ts
│   │   └── manifesto.ts
│   ├── whatsapp.ts
│   ├── tokens.ts
│   ├── validators.ts                      # Zod schemas
│   ├── slug.ts
│   └── format.ts
│
├── types/
│   └── db.ts                              # supabase gen types
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260508000000_initial_schema.sql
│   │   ├── 20260508000001_rls_policies.sql
│   │   ├── 20260508000002_storage_bucket.sql
│   │   └── 20260508000003_seed_data.sql
│   └── config.toml
│
├── public/
├── middleware.ts                          # protege /admin/*
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

**Decisões estruturais:**
- Route groups `(public)` e `admin/`: layouts isolados, deploy único.
- Server Actions em `app/admin/_actions/` (prefixo `_` ignorado pelo router).
- `lib/content/` para conteúdo estático versionado (FAQ, depoimentos, etc.).
- `components/public/Catalog/` agrupado porque é o componente client mais complexo (filtros + estado + memo).
- `supabase/migrations/` versionado em git, aplicado via `supabase db push`.

---

## 6. Fluxo de Dados e Renderização

### 6.1 Site público (leitura)

| Rota | Render | Cache | Origem dos dados |
|---|---|---|---|
| `/` | RSC + ISR (`revalidate: 60`) | regenera a cada 60s, ou imediato via `revalidatePath` | Supabase: `products` ativos com nested `product_colors` e `product_images` |
| `/produtos/[slug]` | RSC + SSG + ISR | `generateStaticParams` no build, ISR ao salvar | Supabase: 1 produto por slug com cores+imagens |
| `/sitemap.xml`, `/robots.txt` | RSC dinâmico | revalidate 1h | lista de slugs ativos |

**Filtros do catálogo** (categoria, cor): 100% client-side, em memória. A landing carrega todos os produtos ativos uma vez e o `<Catalog>` filtra localmente.

**QuickView**: modal preservado do design atual; recebe produto via prop.

### 6.2 Lógica de imagens (PDP, QuickView, card)

**Galeria PDP** ao selecionar uma cor:
- Mostra fotos da cor selecionada PRIMEIRO, genéricas DEPOIS, na mesma galeria.
- Se a cor selecionada não tem fotos, galeria mostra só as genéricas (fallback).

**Card no catálogo:**
- Capa = primeira foto da cor selecionada (default = `colors[0]`).
- Se a cor selecionada não tem foto, capa = primeira genérica (fallback).

**Reorder no admin:** por escopo — dentro de cada cor e dentro das genéricas, separadamente. Não há ordenação global misturada.

### 6.3 Admin (escrita) — Server Actions

Pipeline padrão de toda mutação:
```
Form (client) ──submit──▶ Server Action (server)
                          ├─ requireAdmin()              # valida sessão Supabase + tabela admins
                          ├─ Schema.parse(input)         # Zod
                          ├─ supabase.from(...).mutate()
                          ├─ revalidatePath(...)         # invalida cache do público
                          └─ return { ok, errors? }      # toast no client
```

### 6.4 Upload de imagens

Imagem nunca passa pelo Server Action (limite 4.5MB Vercel + bandwidth). Fluxo:
1. Admin escolhe arquivo no `<ImagesEditor>` (drag-and-drop)
2. Client gera UUID + path `products/{product_id}/{uuid}.{ext}`
3. Browser → `supabase.storage.from('products').upload(path, file)` (RLS aceita só admins via JWT)
4. Server Action `insertImage({ product_id, color_id, storage_path, alt, sort_order })`
5. `revalidatePath('/produtos/[slug]')`

No público, `next/image` consome a URL pública do bucket. `next.config.ts` precisa de `remotePatterns` apontando pro host do Supabase.

**Delete cascade**: ao deletar produto, RLS `on delete cascade` zera `product_images` (e `product_colors`), mas arquivos no Storage não somem sozinhos. Server Action `deleteProduct` busca `storage_path` antes do delete e chama `storage.remove([...])`.

### 6.5 Auth

```
GET /admin/* ──▶ middleware.ts
                  ├─ supabase.auth.getUser()
                  ├─ se !user → redirect('/admin/login')
                  ├─ se user mas !isAdmin → redirect('/admin/login?error=unauthorized')
                  └─ next()
```

`isAdmin` consulta a tabela `admins`. Cadastro inicial: criar user em Supabase Studio → Authentication → Add user, depois inserir `user_id` em `admins`.

### 6.6 Revalidação de cache

| Ação | Paths invalidados |
|---|---|
| Criar/editar/deletar produto | `/`, `/produtos/[slug]`, `/sitemap.xml` |
| Criar/editar/deletar cor ou imagem | `/`, `/produtos/[slug]` |
| Criar/editar/deletar categoria | `/` |

---

## 7. Plano de Migração (Fases)

A pasta `Claude Design - Reference/` permanece intocada até a Fase 8.

### Fase 0 — Setup (~1h)
- `pnpm create next-app@latest` (TS estrito, App Router, Tailwind, ESLint)
- shadcn/ui CLI + primitivos (`button`, `input`, `dialog`, `dropdown-menu`, `table`, `toast`, `form`, `select`)
- `tailwind.config.ts` com tokens do design em `theme.extend.colors`
- DM Sans via `next/font/google`
- `.env.example` com vars do Supabase
- Cria projeto Supabase
- **Saída:** `pnpm dev` mostra "Hello world" com paleta correta

### Fase 1 — Schema + seed (~1.5h)
- 4 migrations: schema, RLS, bucket, seed
- Seed: 4 categorias, 5 produtos atuais com variantes, placeholders de imagem
- `supabase gen types typescript` → `types/db.ts`
- Helpers `lib/supabase/{client,server,admin}.ts`
- **Saída:** script `pnpm tsx scripts/test-fetch.ts` lista produtos via SDK

### Fase 2 — Site público / landing (~4–5h)
- Layout público + page.tsx (RSC busca produtos)
- Porta 1:1 todos componentes do design para `components/public/`
- `lib/content/*.ts` recebem FAQ, testimonials, timeline, store, manifesto
- `lib/whatsapp.ts` com helpers preservados
- Animações de filtro do catálogo preservadas
- **Saída:** landing local visualmente idêntica ao design original

### Fase 3 — PDP (~2h)
- `produtos/[slug]/page.tsx` com `generateStaticParams` + `generateMetadata`
- `components/public/pdp/`: Gallery, ColorSwatches, SizePicker, PdpWhatsAppCTA
- `opengraph-image.tsx` dinâmico
- `sitemap.ts`
- **Saída:** URLs próprias por produto, OG previews funcionando

### Fase 4 — Auth + admin shell (~2h)
- `middleware.ts` protege `/admin/*`
- `admin/login/page.tsx`, `admin/layout.tsx` (AdminShell)
- `lib/auth/require-admin.ts`
- Cadastra primeiro admin manualmente no Supabase Studio
- **Saída:** `/admin` exige login; logado vê dashboard com counts

### Fase 5 — CRUD de produtos (~5–6h)
- Tabela de listagem com busca/filtro/sort
- `<ProductForm>` em sub-arquivos: BasicFields, DimensionsFields, ColorsEditor, ImagesEditor (drag-and-drop via `react-dropzone` + `@dnd-kit`), SeoFields
- Server Actions com Zod
- Upload direto navegador → Supabase Storage
- Hard delete com modal de confirmação
- **Saída:** criar/editar/deletar produto pelo navegador refletindo em `/` em segundos

### Fase 6 — CRUD de categorias (~1h)
- Listagem com edição inline + reorder
- Bloqueio de delete com produtos vinculados
- **Saída:** admin gerencia categorias

### Fase 7 — Polimento + deploy (~2h)
- Loading states, error boundaries, toasts
- `robots.ts`, OG default, favicon
- `next.config.ts` com `remotePatterns`
- Deploy Vercel (env vars, custom domain)
- Smoke test em produção
- **Saída:** site no ar com fluxo completo

### Fase 8 — Limpeza (~5min)
- Apagar `Claude Design - Reference/`
- Commit final

**Total estimado:** ~18–22h efetivas.

---

## 8. Critérios de Sucesso

A migração é considerada completa quando:

1. **Visual:** Landing e PDP entregam paridade visual com o design do Claude Design Reference (paleta, tipografia, layout, animações de filtro).
2. **Funcional público:** Filtros de categoria/cor funcionam, QuickView abre, links de WhatsApp por produto/cor funcionam, navegação para `/produtos/[slug]` funciona, OG previews aparecem ao compartilhar.
3. **Funcional admin:** Login com email/senha funciona, criar produto novo do zero (com cores e imagens) reflete em `/` e `/produtos/[slug]` em ≤5s, editar e deletar funcionam, hard delete remove arquivos do Storage.
4. **SEO:** Sitemap inclui todos slugs ativos, cada produto tem `<title>` e `<meta description>` próprios, robots.txt presente.
5. **Performance:** Lighthouse mobile ≥85 em Performance, LCP <2.5s na landing.
6. **Code quality:** TypeScript estrito sem `any`, sem warnings de ESLint, todo arquivo de componente abaixo de ~250 linhas.
7. **Deploy:** Site acessível em URL pública, admin acessível em `/admin`, env vars configuradas, primeiro admin cadastrado.
8. **Limpeza:** `Claude Design - Reference/` removida do repositório.

---

## 9. Não-objetivos (v1)

Explicitamente **fora** desta migração:

- Carrinho de compras / checkout / pagamento online
- Cálculo de frete
- Edição via UI de FAQ, depoimentos, timeline, info da loja, copy do hero/manifesto (ficam em código)
- Gestão de estoque
- Gestão de pedidos
- Multi-idioma
- Gestão de usuários do admin via UI (cadastro feito direto no Supabase Studio)
- Soft delete / auditoria de mudanças
- Testes automatizados E2E (apenas smoke test manual)
- Analytics / Google Analytics / pixel de conversão
- Dark mode
- Notificações por email

Itens dessa lista podem virar v2 depois que o v1 estiver no ar e validado.

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Paridade visual imperfeita após port para Tailwind | Média | A pasta de referência fica viva durante todas as fases; comparação visual lado-a-lado. Tokens mapeados antes de portar componentes. |
| Upload direto ao Supabase Storage falhar por RLS de bucket | Baixa | Testar política do bucket na Fase 1 com user admin de teste antes de Fase 5. |
| ISR não invalidar como esperado após Server Action | Baixa | `revalidatePath` em paths absolutos e específicos. Smoke test na Fase 5. |
| Free tier do Supabase insuficiente | Baixa | Limites: 500MB DB, 1GB Storage, 50K MAU auth — sobra para esse uso. Monitorar via dashboard. |
| Limite de 4.5MB do Vercel atrapalhar uploads grandes | Já mitigado | Upload é direto navegador→Supabase, não passa pelo backend Next. |
