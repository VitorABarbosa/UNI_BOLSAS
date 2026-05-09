# Uni Bolsas — Plano 01: Foundation (Phases 0+1)

> **Formato:** runbook direcional. Cada tarefa descreve **intenção, decisões, gotchas e verificação** — não cada linha de código. O implementador (humano ou agente) consulta a doc viva da biblioteca/ferramenta no momento da execução. Código literal só aparece quando codifica uma decisão não-óbvia que prosa não captura.
>
> **Por quê:** o ecossistema (Next.js, Tailwind, shadcn, Supabase) muda mensalmente; o plano precisa sobreviver a compactações de contexto e a versões futuras. Intenção + restrições + comandos de verificação são estáveis; código não é.

---

## Goal

Deixar o repositório em estado **funcional, tipado e testável**: projeto Next.js 15 rodando localmente, Supabase com schema/RLS/Storage criados e populados com os 5 produtos da referência (incluindo SVGs gerados como placeholders no bucket), e um smoke-test que prova ponta-a-ponta que o stack lê dados via SDK público.

Após o Plano 01, qualquer pessoa abrindo o repo do zero faz `pnpm install && pnpm db:push && pnpm seed && pnpm dev` e tem o sistema base funcionando.

---

## Architecture (resumo — detalhes na spec)

- **Spec de referência:** `docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md` (seções 4, 5, 6 são as que mais importam aqui)
- **Stack:** Next.js 15 App Router + TS estrito · Tailwind + shadcn/ui · Supabase (Postgres + Auth + Storage) · pnpm
- **Estrutura:** projeto monolítico Next.js no diretório raiz, com `Claude Design - Reference/` preservada como sibling e ignorada pelo build/lint
- **Persistência:** 4 tabelas de catálogo + tabela `admins` · RLS público pra leitura, admin pra escrita · bucket `products` público pra leitura
- **Sem o que ainda:** componentes públicos da landing, PDP, painel admin, auth UI — tudo isso é Plano 02+

## Tech Stack (versões a usar)

Use sempre a **versão estável mais recente** das libs abaixo no momento da execução. Os pinos exatos vêm do `pnpm-lock.yaml` gerado.

- `next`, `react`, `react-dom` — Next.js App Router
- `typescript`, `@types/*` — TS strict
- `tailwindcss`, `postcss`, `autoprefixer` — estilo
- `@supabase/supabase-js`, `@supabase/ssr` — clients SDK
- `server-only` — guard contra import de módulos service-role no cliente
- `tsx`, `dotenv` — execução de scripts TS standalone
- `supabase` (CLI) — migrations/types
- `eslint`, `eslint-config-next`, `@eslint/eslintrc` — lint

shadcn/ui é instalado via CLI (`pnpm dlx shadcn@latest init`), não via dependência direta.

---

## Working Directory & Shell

- Raiz: `C:\Users\power\OneDrive\Documentos\PROJETOS_\Trabalhos\Pessoal\Uni Bolsas`
- Shell: PowerShell 5.1 (não Bash). Cuidado com sintaxe: `$env:VAR`, sem `&&` (use `;` ou `if ($?) { ... }`), here-strings com `@'...'@` no col 0
- A pasta `Claude Design - Reference/` é **read-only** até a Fase 8 — não modificar; pode (e deve) ser **lida** durante toda a migração
- Não há git ainda no início do plano — `git init` faz parte da Task 5

---

## File Inventory

Arquivos criados pelo Plano 01 (caminhos relativos à raiz). Use isso como mapa mental — os detalhes de conteúdo de cada arquivo estão nas tasks abaixo.

**Configuração raiz:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.env.example`, `.env.local` (gitignored), `.gitignore`, `.nvmrc`, `README.md`

**App:** `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Componentes:** `components/ui/*` (gerados pelo shadcn CLI)

**Bibliotecas:** `lib/supabase/{client,server,admin}.ts`, `lib/tokens.ts`, `lib/utils.ts` (criado pelo shadcn)

**Tipos:** `types/db.ts` (gerado por `supabase gen types`)

**Scripts:** `scripts/seed.ts`, `scripts/test-fetch.ts`

**Supabase:** `supabase/config.toml`, `supabase/migrations/<ts>_initial_schema.sql`, `supabase/migrations/<ts>_rls_policies.sql`, `supabase/migrations/<ts>_storage_bucket.sql`, `supabase/seed-assets/images.ts`

---

# PHASE 0 — Project Scaffold

## Task 1 — Inicializar package.json + dependências base

**Intenção:** ter um projeto Node moderno com pnpm, Node 20+, scripts úteis (`dev`, `build`, `typecheck`, `lint`, `db:push`, `db:types`, `seed`, `smoke`), e dependências de produção/dev do Next.js + TS instaladas.

**Decisões já tomadas (não revisitar):**
- Pacote: pnpm (não npm/yarn) — lockfile determinístico
- Node 20+ pinado em `.nvmrc`
- TS strict (decidido no spec, seção 2)
- Sem `src/` — App Router direto na raiz (`app/`)
- Import alias: `@/*` apontando pra raiz

**Como abordar:**
1. Conferir `node --version` (precisa ser 20+; se for menor, abortar e instruir o user)
2. Criar `.nvmrc` com `20`
3. Criar `package.json` mínimo (`name: "uni-bolsas"`, `private: true`, scripts placeholders) — preencher os scripts ao longo do plano conforme cada um for relevante
4. Criar `.gitignore` cobrindo: `node_modules/`, `.next/`, `out/`, `next-env.d.ts`, `.env`, `.env.*.local`, `.supabase/`, `dist/`, `Thumbs.db`, `desktop.ini` (relevante no OneDrive), `.vscode/`, `.idea/`
5. Instalar deps de prod: `next react react-dom`
6. Instalar deps de dev: `typescript @types/{react,react-dom,node} eslint eslint-config-next tsx @eslint/eslintrc`

**Gotchas:**
- OneDrive sincroniza no fundo — pode confundir o file watcher do Next em raras ocasiões; se aparecerem rebuilds fantasma, pausar o sync do OneDrive durante dev
- Não rodar `pnpm create next-app` no diretório atual: ele rejeita diretórios não-vazios. Scaffold manual é o caminho.

**Verificação:**
- `pnpm exec next --version` imprime versão Next 15+
- `node_modules/` e `pnpm-lock.yaml` existem

**Commit:** `chore: initialize pnpm workspace with next + typescript`

---

## Task 2 — TypeScript, Next config, ESLint flat config

**Intenção:** TS estrito no nível mais alto razoável (sem `any` velado, sem index access "safe-by-default"), Next configurado pra aceitar imagens do Supabase Storage (uma vez que `NEXT_PUBLIC_SUPABASE_URL` exista), ESLint herdando de `next/core-web-vitals` + `next/typescript`.

**Decisões:**
- Strict flags: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`
- Path alias `@/*` → `./*`
- `exclude` no tsconfig DEVE incluir `"Claude Design - Reference"` (senão TS tenta tipar os JSX da referência e quebra)
- ESLint flat config (`eslint.config.mjs`) — formato moderno; mesma exclusão da pasta de referência
- `next.config.ts` calcula `remotePatterns` derivando o hostname de `NEXT_PUBLIC_SUPABASE_URL` em runtime de build (se a env não existir, sem patterns — não quebra)
- `experimental.typedRoutes: true` — ganha autocomplete em `<Link href>`

**Gotchas:**
- A pasta de referência tem espaços no nome (`Claude Design - Reference`); citar entre aspas em qualquer glob/exclude
- `noUncheckedIndexedAccess` força `array[i]!` ou checagem `if (item)` — incomoda no início mas evita bugs reais
- Next 15 usa `next.config.ts` (não `.js`/`.mjs`) — é a sintaxe moderna

**Verificação:**
- `pnpm typecheck` exit 0 (mesmo sem código ainda)
- ESLint config carrega sem erros: `pnpm exec eslint --version`

**Commit:** `chore: configure typescript strict, next, and eslint flat config`

---

## Task 3 — Tailwind + design tokens em CSS vars

**Intenção:** Tailwind funcionando, com a paleta da Uni Bolsas exposta como utility classes (`bg-bone`, `text-leather`, `text-wine`, etc.) E como CSS vars (pra valores dinâmicos / acesso fora do Tailwind).

**Decisões:**
- Tokens são definidos UMA vez em `lib/tokens.ts` (TS const) e UMA vez em `app/globals.css` (CSS vars `--color-*`)
- `tailwind.config.ts` mapeia `theme.extend.colors.bone` → `var(--color-bone)` etc. — assim Tailwind vira interface pra os mesmos vars (sem duplicar valores em três lugares)
- Fonts: DM Sans (sans, body) + Fraunces (serif, headlines) carregadas via `next/font/google` no layout raiz, expostas como CSS vars `--font-dm-sans` e `--font-fraunces`
- Tailwind `fontFamily.sans/serif` aponta pra essas vars

**Tokens a portar** (de `Claude Design - Reference/Uni Bolsas/js/tokens.jsx`): `bone`, `boneLight`, `ink`, `charcoal`, `stone`, `whisper`, `pearl`, `leather`, `leatherDark`, `caramel`, `wine`, `sage`, `black`, `whatsapp`, `whatsappDark`. Constantes não-cor: `WHATSAPP_NUMBER` (`"5511988063432"`), `INSTAGRAM_HANDLE` (`"uni_bolsas"`).

**Gotchas:**
- Tailwind v4 (se for o que o pnpm resolver) tem sintaxe diferente — config via CSS, não `tailwind.config.ts`. Se for v4, ajustar a abordagem: tokens vão em `@theme` no globals.css. Conferir docs Tailwind no momento.
- Não confundir o `bone` do design (off-white quente) com o branco puro — `bone: #F4EFE6` é a cor de fundo padrão do site

**Verificação:**
- `pnpm dev` deve compilar sem erro (mesmo sem `app/layout.tsx` ainda — é a próxima task)

**Commit:** `chore: configure tailwind with design tokens and dual font setup`

---

## Task 4 — Layout raiz + página placeholder

**Intenção:** verificar visualmente que tokens + fontes funcionam. Não é a landing real (essa é Plano 02) — é só uma "página placeholder" tipo "Uni Bolsas — em construção".

**Decisões:**
- Layout raiz aplica as font vars no `<html>` (`className={dmSans.variable} ${fraunces.variable}`)
- `<body>` usa `font-sans` (Tailwind → DM Sans) por default
- Metadata padrão: title "Uni Bolsas — Atacado e Varejo · Brás SP", description institucional curta
- Lang: `pt-BR`
- Página placeholder usa: bone background herdado do `<body>`, headline italic em Fraunces, subtítulo em DM Sans, layout centralizado

**Gotchas:**
- `next/font/google` precisa de internet no primeiro build — se a máquina estiver offline, falha (raro)
- A landing real do Plano 02 vai REESCREVER `app/page.tsx` — esse placeholder é descartável

**Verificação:**
- `pnpm dev` → abrir `http://localhost:3000`
- Background: warm off-white (NÃO branco puro)
- Headline em italic com serif elegante (Fraunces)
- Subtítulo em sans-serif (DM Sans)
- Devtools: `:root` tem todas as CSS vars `--color-*` definidas

**Commit:** `feat: add placeholder home with design tokens applied`

---

## Task 5 — git init + primeiro commit

**Intenção:** ter histórico desde o scaffold zero. A pasta `Claude Design - Reference/` ENTRA neste primeiro commit (ela é parte do projeto até a Fase 8).

**Decisões:**
- `git init` agora, não antes — assim o primeiro commit já tem todo o scaffold + reference
- Branch principal: `main` (default moderno)
- Mensagem do primeiro commit deve indicar que é o início do projeto migrado

**Gotchas:**
- Verificar antes que `.gitignore` está cobrindo `node_modules/`, `.env.local`, `.next/` — se faltar, o primeiro commit fica gigante
- `git status` precisa mostrar `.env.local` como **untracked-but-ignored** (ou seja, não aparece). Se aparecer, `.gitignore` tá errado.

**Verificação:**
- `git log --oneline` mostra 1 commit
- `git status` retorna "working tree clean"
- A pasta de referência aparece no `git ls-files | head` (incluída)

**Commit:** `chore: initial commit — scaffold next.js + tailwind + design tokens, preserving reference`

---

## Task 6 — shadcn/ui init + primitivos do admin

**Intenção:** ter as primitivas shadcn/ui prontas (`Button`, `Input`, `Dialog`, etc.) que vão ser consumidas pelo painel admin no Plano 03. Instalar agora e não adiar — assim o sistema de tokens já fica reconciliado com as CSS vars do shadcn de uma vez.

**Decisões:**
- Style: **Default** (não New York) — visual mais neutro
- Base color: **Neutral**
- CSS variables: **Yes** (consistente com nossa abordagem)
- Primitivas a instalar: `button input label textarea form select dialog dropdown-menu table toast badge`

**Gotcha CRÍTICO:** o `shadcn init` SOBRESCREVE `app/globals.css`. Você PRECISA mesclar manualmente os tokens do design (que foram criados na Task 3) DE VOLTA no globals.css depois do init. Resultado final: bloco `:root` com NOSSAS vars (`--color-bone`, etc.) E as do shadcn (`--background`, `--foreground`, `--radius`, etc.) coexistindo.

**Gotchas adicionais:**
- shadcn pode atualizar o `tailwind.config.ts` adicionando suas próprias cores — mantém as duas paletas, não conflita (são chaves diferentes)
- Se shadcn perguntar sobre dark mode: aceitar default ("yes") — não vamos usar agora, mas custa zero deixar
- shadcn cria `lib/utils.ts` com `cn()` helper — mantém, é usado por todas as primitivas

**Verificação:**
- `components/ui/button.tsx` etc. existem
- `app/globals.css` contém AMBOS os blocos de vars (design tokens + shadcn)
- `pnpm dev` ainda renderiza a placeholder correta (background bone, não branco)
- `pnpm typecheck` clean

**Commit:** `chore: add shadcn/ui with admin primitives and merged token vars`

---

# PHASE 1 — Supabase: schema, RLS, storage, seed

## Task 7 — Criar projeto Supabase + env vars (passo manual + arquivos de env)

**Intenção:** ter um projeto Supabase real provisionado e as 3 envs necessárias presentes em `.env.local` (gitignored) com template em `.env.example` (commitado).

**Passos manuais (humano executa):**
1. supabase.com/dashboard → New project
2. Nome: `uni-bolsas`
3. Senha do banco: gerar forte e GUARDAR em password manager (precisa em todo `db:push`, `db:reset`, `link`)
4. Região: **South America (São Paulo)** — latência mínima pros usuários do Brasil
5. Plano: Free
6. Aguardar ~2 min de provisionamento
7. Project Settings → API → copiar `Project URL`, `anon key`, `service_role key`

**Envs a definir** (em `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto (público, vai pro browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave pública (público, vai pro browser, escopo limitado por RLS)
- `SUPABASE_SERVICE_ROLE_KEY` — bypassa TODO RLS, **server-only**

**Gotchas críticos:**
- `service_role key` NUNCA pode ter prefixo `NEXT_PUBLIC_` — Next exporia pro bundle do browser
- O `lib/supabase/admin.ts` (Task 10) DEVE ter `import 'server-only'` no topo — é a barreira em build-time que impede import acidental no client
- `.env.local` JAMAIS é commitado — confirmar que está em `.gitignore`

**Verificação:**
- `git status` não mostra `.env.local` como untracked (ele tá ignorado corretamente)
- `.env.example` está commitado e contém as 3 chaves com valores placeholder

**Commit:** `chore: add env template for supabase`

---

## Task 8 — Supabase CLI: install + init + link

**Intenção:** ter o CLI do Supabase configurado pra rodar migrations e gerar tipos. Linkar o projeto local com o remoto pra todo `db push` ir pro projeto certo.

**Decisões:**
- CLI instalado como devDependency (não global) — versionado no `pnpm-lock.yaml`, contributor não precisa instalar globalmente
- `supabase init` cria `supabase/config.toml` (commitado) e `supabase/.gitignore` (commitado)
- `supabase link --project-ref <REF>` salva o link em `supabase/.temp/` (gitignored)
- O `<PROJECT_REF>` é a parte do dashboard URL: `supabase.com/dashboard/project/abcdefghij` → ref é `abcdefghij`

**Gotchas:**
- No Windows, o pacote `supabase` no npm é só um wrapper que baixa o binário no postinstall — pode ser lento na primeira vez
- O `link` pede a senha do DB (a mesma da Task 7) — ter em mãos
- Se for trabalhar em outra máquina depois, basta rodar `link` de novo lá; nada disso fica "amarrado" ao filesystem desta máquina

**Verificação:**
- `pnpm exec supabase --version` imprime versão
- `pnpm exec supabase status` reporta link com o projeto remoto
- `supabase/config.toml` existe e está commitado

**Commit:** `chore: init supabase cli and link project`

---

## Task 9 — Migration 1: schema inicial (5 tabelas)

**Intenção:** criar as 5 tabelas do spec (`categories`, `products`, `product_colors`, `product_images`, `admins`) com FKs, índices e triggers de `updated_at`.

**Schema:** ver spec seção 4.1. NÃO duplicar o SQL aqui — implementador abre o spec e copia/adapta. O plano só documenta as decisões e gotchas.

**Decisões importantes (resumo da spec):**
- `categories.id` é uuid (não text) — admin pode editar slug/label sem cascata em FK
- `categories.slug` é unique (usado em URLs futuras tipo `/categoria/bolsas`)
- `products.category_id` é `uuid not null` com `on delete restrict` (deletar categoria com produtos não-vazios falha — comportamento desejado, validado pelo admin antes)
- `product_colors` tem `accent_hex` (nullable) pra bicolores tipo "Preto / Pink"
- `product_images.color_id` é nullable — NULL significa "imagem genérica do produto"
- `product_images.color_id` tem `on delete cascade` — apagar cor remove suas imagens
- `products.sizes` é `text[] not null default '{Único}'`
- `products.price_retail` é `numeric(10,2)` (não `text`); `price_wholesale` é `text` (string de marketing tipo "A partir de R$ 65 · 10un+")
- Triggers de `updated_at` em `categories` e `products` (não nas tabelas filhas — não vale o ruído)
- Índices: `products(category_id)`, `products(active, sort_order)`, `product_colors(product_id, sort_order)`, `product_images(product_id, color_id, sort_order)`

**Como criar a migration:**
1. `pnpm exec supabase migration new initial_schema` — gera arquivo `supabase/migrations/<timestamp>_initial_schema.sql` vazio
2. Editar o arquivo: copiar o SQL da spec seção 4.1, adaptar (já temos a versão final lá)
3. Adicionar a função `set_updated_at()` e os 2 triggers no fim
4. `pnpm db:push` aplica no remoto

**Gotchas:**
- `gen_random_uuid()` precisa da extensão `pgcrypto` — Supabase já vem com ela habilitada por default no schema `extensions`, mas se der erro "function does not exist", rodar `create extension if not exists pgcrypto;` no início da migration
- A primeira migration vai pedir confirmação no `db:push` (`Do you want to push these migrations to the remote database?`) — confirmar com `y`

**Verificação:**
- Studio → Table Editor mostra 5 tabelas
- Studio → Database → Indexes mostra os 4 índices criados
- `select * from public.products limit 1;` retorna 0 rows (esperado — sem seed ainda)

**Commit:** `feat(db): initial schema (categories, products, colors, images, admins)`

---

## Task 10 — Migration 2: RLS policies

**Intenção:** ativar RLS em todas as 5 tabelas; criar 4 policies por tabela de catálogo (read público + insert/update/delete só admin); deixar `admins` totalmente protegida (só service_role acessa).

**Padrão de implementação:**

Para cada tabela em `[categories, products, product_colors, product_images]`:
- `enable row level security`
- Policy `<table>_read_public` — `for select using (true)` — qualquer um lê
- Policy `<table>_admin_insert` — `for insert to authenticated with check (public.is_admin())`
- Policy `<table>_admin_update` — `for update to authenticated using (...) with check (...)` (a mesma checagem nas duas cláusulas)
- Policy `<table>_admin_delete` — `for delete to authenticated using (public.is_admin())`

Para `admins`: `enable row level security` E NADA MAIS — sem policies = nega tudo pra anon/authenticated; só `service_role` (que bypassa RLS) acessa.

**Função helper crítica:**

Criar `public.is_admin()` ANTES das policies — função `stable security definer` que retorna `bool`, fazendo `select exists (select 1 from public.admins where user_id = auth.uid())`. **Crítico:** `security definer` + `set search_path = public` + `grant execute to anon, authenticated`. Sem isso, as policies não conseguem chamar a função.

**Decisões:**
- Não usar `app_metadata.role = 'admin'` no JWT (alternativa válida, mas exige sincronizar JWT a cada mudança de admin) — tabela `admins` é mais simples de gerenciar
- Policies pra `update` precisam de AMBOS `using` E `with check` (using verifica linha existente, with check verifica nova versão) — copiar/colar mesma expressão

**Gotchas:**
- Esquecer de criar `is_admin()` antes das policies → erro "function does not exist"
- Esquecer `grant execute on function ... to anon, authenticated` → policies retornam permission denied silenciosamente
- Esquecer de habilitar RLS na tabela `admins` → leitura pública revela quem são os admins (vulnerabilidade de privacidade, embora não seja exploitável diretamente)
- O `using (true)` em select é proposital — leitura é pública mesmo sem login (catálogo aberto). Não é bug.

**Verificação:**
- Studio → Authentication → Policies mostra 16 policies (4 por tabela × 4 tabelas)
- `admins` aparece com 0 policies E RLS habilitado
- Testar em SQL Editor (que roda como service_role): `select public.is_admin();` retorna `false` (porque `auth.uid()` é null em service_role) — confirma que a função compila

**Commit:** `feat(db): rls policies — public read, admin write`

---

## Task 11 — Migration 3: Storage bucket `products` + RLS

**Intenção:** criar o bucket `products` (público), com policies espelhando o padrão das tabelas: read público, write admin-only.

**Implementação:**

1. `insert into storage.buckets` com `id='products'`, `name='products'`, `public=true`, `file_size_limit=5242880` (5 MB), `allowed_mime_types=array['image/webp','image/jpeg','image/png','image/svg+xml']`. Usar `on conflict (id) do nothing` pra idempotência.

2. 4 policies em `storage.objects`:
   - `products_bucket_read_public` — `for select using (bucket_id = 'products')`
   - `products_bucket_admin_insert` — `for insert to authenticated with check (bucket_id = 'products' and public.is_admin())`
   - `products_bucket_admin_update` — `for update` com using+with check
   - `products_bucket_admin_delete` — `for delete using (bucket_id = 'products' and public.is_admin())`

**Decisões:**
- SVG está nos allowed_mime_types pra suportar o seed (placeholders são SVGs); pode ser removido depois quando admin só upar fotos reais — mas deixar não custa
- Limite 5MB cobre fotos de produto otimizadas com folga
- Bucket público é OK porque a URL pública (`/storage/v1/object/public/products/...`) só serve leitura; mutações exigem auth

**Gotchas:**
- Storage RLS é num schema diferente (`storage.objects`), não confunde com policies de tabelas
- `public.is_admin()` precisa estar criada (Task 10) — Storage policies dependem dela
- Se esquecer `bucket_id = 'products'` nas checagens, a policy aplica ao bucket inteiro do projeto (potencial impacto em outros buckets futuros)

**Verificação:**
- Studio → Storage mostra bucket `products` marcado como `public`
- Studio → Authentication → Policies → escopo "Storage" mostra 4 policies do bucket
- Tentar listar arquivos via SQL ou Studio retorna lista vazia (bucket recém-criado)

**Commit:** `feat(db): storage bucket products with rls`

---

## Task 12 — Gerar tipos TS do schema

**Intenção:** ter `types/db.ts` com tipagem ponta-a-ponta gerada do schema real do Supabase. Toda query SDK ganha autocomplete e checagem em tempo de build.

**Como:**
- Comando: `pnpm db:types` (que executa `supabase gen types typescript --linked > types/db.ts`)
- O arquivo é regenerado a cada vez que o schema muda — sempre rodar depois de uma migration

**Decisões:**
- `--linked` usa o projeto linkado (Task 8) — não precisa passar project ref
- Outputado para `types/db.ts` (não `lib/supabase/types.ts`) — separação de tipos vs. SDK helpers

**Gotchas:**
- Se o comando falhar com "no project linked", rodar `supabase link` de novo
- Se rodar antes da Task 9 (sem schema), gera arquivo válido mas vazio
- O arquivo gerado tem header "DO NOT EDIT" — qualquer edit manual será sobrescrito na próxima geração

**Verificação:**
- `types/db.ts` existe e tem ~1000 linhas
- Contém `Database['public']['Tables']` com 5 tabelas (`categories`, `products`, `product_colors`, `product_images`, `admins`)
- Cada tabela tem `Row`, `Insert`, `Update` types
- `pnpm typecheck` clean

**Commit:** `chore(db): generate typescript types from schema`

---

## Task 13 — Supabase clients (browser, server, admin)

**Intenção:** três helpers que encapsulam criação de cliente Supabase pra os três contextos: navegador, RSC/Server Action, script server-only com service role.

**Arquivos:**
- `lib/supabase/client.ts` — `createBrowserClient` de `@supabase/ssr`. Usado dentro de `'use client'`. Lê `NEXT_PUBLIC_*` envs.
- `lib/supabase/server.ts` — `createServerClient` de `@supabase/ssr`. Usado em RSC e Server Actions. Lê cookies via `next/headers`. **Async** (porque `cookies()` é async no Next 15+).
- `lib/supabase/admin.ts` — `createClient` de `@supabase/supabase-js` direto, com a service role key. **`import 'server-only'` NA PRIMEIRA LINHA** — barreira em build-time.

**Padrão `createServerClient`:**
- Usa `cookies()` de `next/headers` (await)
- Implementa `cookies.getAll()` retornando `cookieStore.getAll()`
- Implementa `cookies.setAll(toSet)` chamando `cookieStore.set(name, value, options)` em loop, em try/catch (Server Components não podem setar cookies; o `try/catch` engole o erro silenciosamente — ok porque o middleware vai refrescar a sessão em request seguinte)

**Padrão `createAdminClient`:**
- Lê `NEXT_PUBLIC_SUPABASE_URL` (URL é pública mesmo) e `SUPABASE_SERVICE_ROLE_KEY`
- Throw explícito se as envs faltarem (better fail fast em script time)
- Opções: `auth.autoRefreshToken: false`, `auth.persistSession: false` — script não precisa de sessão

**Tipagem:**
Todos os 3 clients são genéricos: `createClient<Database>(...)`. Importar `Database` de `@/types/db`.

**Gotchas:**
- Esquecer `'server-only'` em `admin.ts` é um furo de segurança grave — tem que ser a primeira linha
- O `createServerClient` em Next 15 PRECISA do `await cookies()` — em versões anteriores era síncrono
- Não exportar default — exportar `createClient` named em cada arquivo, pra ficar claro qual cliente é qual no chamador (`import { createClient } from '@/lib/supabase/server'`)
- Instalar `server-only` como dep: `pnpm add server-only`

**Verificação:**
- `pnpm typecheck` clean
- `import { createAdminClient } from '@/lib/supabase/admin'` em um Client Component (test temporário) → erro de build mencionando `server-only` — confirma a barreira

**Commit:** `feat(supabase): browser, server, and admin client helpers`

---

## Task 14 — Portar SVG generators da referência

**Intenção:** reescrever `Claude Design - Reference/Uni Bolsas/js/images.js` como módulo TS exportando funções puras que **retornam strings SVG** (não data URIs).

**Por que strings SVG, não data URIs:** o seed vai fazer upload pra Supabase Storage como arquivo `.svg`. Data URI não dá pra upar — precisa ser um Blob/Buffer com o SVG cru.

**Funções a portar** (de `images.js`):
- `matelasse(hex)` → SVG da bolsa matelassê na cor `hex`
- `lartlune(hex)` → SVG do kit transversal
- `mochila(hex, accent)` → SVG da mochila bicolor
- `fitness(hex)` → SVG da bolsa fitness
- `sport(hex, open?)` → SVG da mala sport (variante "aberta" pra vista interna)
- `lifestyle(hex, label)` → SVG editorial com silhueta de pessoa segurando bolsa (usado pela mochila bicolor preto/branco como segunda foto)

**O que NÃO portar agora:** `promo()`, `brandHero()`, `logo()`, `atelier()`, `igPost()` — esses são pra outras seções (Hero, Manifesto, Social) que entram no Plano 02 como assets estáticos em `/public`, não em Storage.

**Decisões:**
- Helpers internos: `frame(content, label, sublabel)` (wrapper editorial), `shadow()` (elipse de sombra) — manter
- Remover `dataUri()` — não usamos
- Cada função `export function ...(...) string` — TS estrito vai forçar tipos explícitos
- Localização: `supabase/seed-assets/images.ts`

**Gotchas:**
- O HTML original tem entidades XML (`L&apos;ART&amp;LUNE`) — preservar
- viewBox 400x400 é o padrão (exceto `lifestyle` que também é 400x400 mas sem `frame`)
- Não precisa otimizar SVG agora — é placeholder; admin vai uplodar fotos reais depois

**Verificação:**
- `pnpm typecheck` clean
- Inspeção manual: abrir um SVG retornado em qualquer função (ex: `console.log(matelasse('#0F0F0F'))`) e colar em codepen.io ou similar — deve renderizar uma silhueta de bolsa preta sobre fundo bone

**Commit:** `chore(seed): port svg generators from reference`

---

## Task 15 — Seed script: popular DB + upload de SVGs pra Storage

**Intenção:** ter um script idempotente que limpa o catálogo (DB + Storage) e re-popula com os 5 produtos da referência, fazendo upload de cada SVG gerado como arquivo no bucket.

**Arquivo:** `scripts/seed.ts`. Executável via `pnpm seed`.

**Estrutura:**
1. Carrega envs de `.env.local` via `dotenv/config`
2. Cria admin client (service-role) — bypassa RLS
3. **Define dados** em uma estrutura tipada: array de produtos, cada produto com array de cores, cada cor com array de SVG strings (uma por foto). Os dados base vêm de `Claude Design - Reference/Uni Bolsas/js/data.jsx` (PRODUCTS), mapeados para o schema da DB.
4. **Wipe phase:** delete de `product_images`, `product_colors`, `products`, `categories` em ordem (mas FK cascades dispensam ordem rigorosa); listar e deletar todos arquivos do bucket `products`
5. **Insert phase:** inserir categorias, depois produtos (com lookup de `category_id` por slug), depois cores, depois pra cada cor: gerar UUID, fazer upload do SVG no Storage com path `{product_id}/{uuid}.svg`, inserir row em `product_images` com `storage_path`
6. Logging amigável: emoji + nome do produto sendo inserido

**Mapeamento detalhado** (5 produtos, 23 cores, 26 imagens):

| Produto | slug | categoria | cores | imgs totais |
|---|---|---|---|---|
| Matelassê Mini | `matelasse-mini` | bolsas | 5 | 5 |
| Kit L'ART&LUNE | `lartlune-kit` | kits | 6 | 6 |
| Mochila Mini Bicolor | `mochila-mini-bicolor` | mochilas | 5 | 6 (preto/branco tem 2: bag + lifestyle) |
| Bolsa Fitness | `fitness` | esportivas | 5 | 5 |
| Mala Sport | `sport` | esportivas | 2 | 4 (cada cor tem `sport(hex)` + `sport(hex, true)`) |

Os campos exatos (tagline, description, dimensions, weight, material, sizes, badge, price_retail, price_wholesale) vêm direto de `data.jsx`. Mapeamento direto de campos JS → SQL:
- `name` → `name`
- `tagline` → `tagline`
- `description` → `description`
- `category` → resolver via `slug → id` lookup
- `badge` → `badge`
- `price` (string "R$ 89,00") → parsear pra numeric (`89.00`) em `price_retail`
- `priceWholesale` → `price_wholesale` (manter como text)
- `dimensions`, `weight`, `material` → mesmos
- `sizes` → array (já é array no JS)
- `colors[].name` → `name`, `colors[].hex` → `hex`, `colors[].accent` → `accent_hex`
- `colors[].images` → upload e refs em `product_images`

**Decisões:**
- `sort_order` dos produtos: 10, 20, 30, 40, 50 (gaps de 10 pra inserir manualmente entre eles depois sem reordenar tudo)
- `sort_order` das cores e imagens: índice no array (0, 1, 2, ...)
- `alt` text das imagens: `${product.name} ${color.name}` (+ "· variação N" se for a 2ª/3ª da mesma cor)

**Gotchas:**
- Precisar de `crypto.randomUUID` — Node 20+ tem nativo, importar de `node:crypto`
- Upload de Blob/Buffer: `Blob([svg], { type: 'image/svg+xml' })` — Node 18+ tem Blob nativo
- O `delete().neq('id', '00000000-...')` é o idiom Supabase pra "deletar tudo" (a SDK exige uma cláusula filter — `neq` com UUID que nunca existe = delete-all)
- Após delete em `categories`, FK em `products` cai por cascade? NÃO — `products.category_id` tem `on delete restrict`. Solução: deletar produtos ANTES de deletar categorias (a ordem importa: images → colors → products → categories → bucket)
- `dotenv/config` deve ser o PRIMEIRO import — antes de qualquer arquivo que leia `process.env.*`

**Como executar:**
```
pnpm seed
```

Saída esperada (resumo):
- "🌱 Seeding..."
- "cleaning previous seed..."
- "inserting categories..."
- "inserting product matelasse-mini..." × 5
- "✅ Seed complete."

**Verificação pós-seed:**
- Studio → products: 5 rows
- Studio → product_colors: 23 rows
- Studio → product_images: 26 rows
- Studio → Storage → products: 5 pastas (UUIDs), com 5/6/6/5/4 SVGs respectivamente
- Abrir uma URL pública direto: `https://<ref>.supabase.co/storage/v1/object/public/products/<um-storage-path>` deve renderizar o SVG da bolsa

**Commit:** `feat(seed): populate db and upload placeholder svgs`

---

## Task 16 — Smoke test: fetch ponta-a-ponta via anon

**Intenção:** provar que o stack inteiro funciona: SDK público lê produtos com nested colors+images via RLS de leitura pública, e a string `storage_path` montada com a base URL do Supabase resulta em uma URL servível.

**Arquivo:** `scripts/test-fetch.ts`. Executável via `pnpm smoke`.

**O que faz:**
1. Cria client com `NEXT_PUBLIC_SUPABASE_ANON_KEY` (não service role — testa as RLS reais)
2. Query `from('products').select('id, slug, name, price_retail, active, sort_order, category:categories(slug, label), colors:product_colors(...), images:product_images(...)').eq('active', true).order('sort_order')`
3. Imprime tabela amigável: nome, preço, categoria, contagem de cores, contagem de imagens
4. Exit code 1 se falhar — pra usar em CI futuramente

**Decisões:**
- Query com nested selects (sintaxe Supabase: `categories(slug, label)` retorna o objeto da categoria como property `category`) — isso valida que as FKs estão corretas
- Filtra por `active = true` — espelha o que o site público vai fazer
- Ordena por `sort_order` — espelha o site público

**Gotchas:**
- Se RLS estiver mal configurada e a query retornar 0 rows: a primeira hipótese é "policies de SELECT faltando" — verificar Studio
- Se a query funcionar mas o nested ficar `null`: o nome do alias na select tá errado (`category:categories(...)` — o alias é nome da PROPRIEDADE, `categories` é o nome da tabela referenciada)

**Saída esperada:**
- "✅ Fetched 5 products via anon key:"
- 5 linhas, uma por produto, cada uma com contagem de cores e imagens
- "✅ Smoke test passed."

**Verificação adicional manual:**
Pegar um `storage_path` da saída e abrir no browser:
`https://<PROJECT_REF>.supabase.co/storage/v1/object/public/products/<path>` → SVG renderiza.

**Commit:** `test(smoke): fetch products end-to-end via anon`

---

## Task 17 — Cadastrar primeiro admin (passo manual)

**Intenção:** ter pelo menos um usuário com acesso de admin gravado em `auth.users` E em `public.admins` — pré-requisito pra Plano 03 (login do painel).

**Passos manuais:**
1. Studio → Authentication → Users → Add user → "Create new user"
2. Email: o seu (`vitor.barbosa232006@gmail.com` ou outro)
3. Senha: forte, guardar em password manager
4. **Auto Confirm User: ON** (skip verificação por email)
5. Copiar o UUID do usuário criado
6. SQL Editor → `insert into public.admins (user_id) values ('<UUID>');`
7. Confirmar com `select * from public.admins;` → 1 row

**Gotchas:**
- Esquecer "Auto Confirm" → user fica em estado pendente, login dá "email not confirmed". Pode desfazer no SQL: `update auth.users set email_confirmed_at = now() where email = '...'`
- Não rodar `select public.is_admin();` no SQL Editor pra "validar" — Studio roda como service_role, `auth.uid()` é null, `is_admin()` retorna false — não é bug

**Verificação:**
- 1 row em `public.admins`
- 1 row em `auth.users` com `email_confirmed_at` preenchido

(Sem commit — passo puramente operacional)

---

## Task 18 — README + verificações finais

**Intenção:** documentar setup, scripts e estado pra qualquer dev (incluindo futuro-você-em-nova-sessão) pegar o repo e levantar do zero. Rodar a bateria final de checks.

**README deve cobrir:**
- Hook intro: "Catálogo da Uni Bolsas — fabricante no Brás · SP"
- Aviso sobre `Claude Design - Reference/` (preservada até Fase 8)
- Stack (1 linha)
- Setup em 4 passos: install, copy env, db push + seed, dev
- Tabela de scripts úteis
- Como cadastrar admin (passos da Task 17)
- Layout do projeto (árvore alta-level, 2 níveis de profundidade no máximo)
- Roadmap com checkboxes das 8 fases (Phase 0 e 1 marcadas como done)

**Bateria final:**
1. `pnpm typecheck` — clean
2. `pnpm lint` — clean (warnings ok, erros não)
3. `pnpm smoke` — 5 produtos listados
4. `pnpm build` — Next compila sem erro
5. `git status` — working tree clean
6. `git log --oneline` — ~12-15 commits cobrindo as 18 tasks

**Commit:** `docs: readme with setup, scripts, and roadmap`

---

# Definition of Done — Plano 01

O plano está concluído quando TODOS os itens abaixo são verdadeiros:

- [ ] **Boot:** `pnpm dev` serve `http://localhost:3000` com placeholder em DM Sans + Fraunces sobre fundo bone
- [ ] **Typecheck clean:** `pnpm typecheck` exit 0
- [ ] **Lint clean:** `pnpm lint` exit 0 (warnings ok)
- [ ] **Build clean:** `pnpm build` exit 0
- [ ] **Schema aplicado:** Studio mostra 5 tabelas com colunas e índices da spec § 4.1
- [ ] **RLS ativo:** 16 policies criadas (4 por tabela × 4 tabelas de catálogo); `admins` com 0 policies + RLS habilitado
- [ ] **Storage ativo:** bucket `products` público com 4 RLS policies
- [ ] **Seed populado:** 4 categorias, 5 produtos, 23 cores, 26 imagens; SVGs em Storage organizados por UUID de produto
- [ ] **Smoke OK:** `pnpm smoke` lista 5 produtos com cores e imagens via anon key
- [ ] **Admin existe:** 1 row em `public.admins` referenciando 1 user em `auth.users`
- [ ] **Referência preservada:** `Claude Design - Reference/` intacta
- [ ] **Histórico limpo:** working tree clean, ~12-15 commits

---

# O que NÃO está nesse plano (próximos planos)

- **Plano 02** — UI pública (landing single-page + PDP `/produtos/[slug]`)
- **Plano 03** — auth, shell admin, CRUD de produtos com upload de imagens, CRUD de categorias
- **Plano 04** — deploy Vercel + remoção de `Claude Design - Reference/`

Cada plano subsequente assume que TODO o estado do plano anterior está cumprido — começa lendo este arquivo + a spec + o código atual.

---

# Como continuar em uma nova sessão

Se você está abrindo esse arquivo num futuro distante (memory/contexto compactado), rode na seguinte ordem pra reconstruir contexto:

1. Ler `docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md` (visão geral da migração)
2. Ler este arquivo até aqui
3. `git log --oneline` no repo pra ver onde a execução parou
4. Conferir Definition of Done acima — quais itens já estão ✅ e quais faltam
5. Continuar do primeiro item não-✅
6. Após Plano 01 cumprir todos os DoDs, abrir nova conversa pedindo "Plano 02 — Public Site"
