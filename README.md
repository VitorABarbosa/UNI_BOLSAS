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

## Layout do projeto

```
app/                       # Next.js App Router
  layout.tsx               # html, fontes, metadata
  page.tsx                 # placeholder (substituido na Fase 2)
  globals.css              # Tailwind v4 + design tokens + shadcn vars
components/ui/             # primitivas shadcn (button, input, dialog, ...)
lib/
  tokens.ts                # paleta TS (espelha CSS vars)
  utils.ts                 # cn() helper
  supabase/
    client.ts              # createBrowserClient ('use client')
    server.ts              # createServerClient (RSC + Server Actions)
    admin.ts               # service-role, server-only
types/
  db.ts                    # gerado de supabase gen types
scripts/
  seed.ts                  # popula DB + Storage
  test-fetch.ts            # smoke
  create-admin.ts          # cria auth user + admins row
supabase/
  config.toml              # supabase init
  migrations/              # SQL versionado
  seed-assets/images.ts    # geradores de SVG (placeholders)
Claude Design - Reference/ # protótipo original (preservado até Fase 8)
docs/superpowers/          # plans + specs da migração
```

## Roadmap

- [x] **Plano 01 — Foundation:** scaffold Next.js + Tailwind + shadcn, projeto Supabase, schema com RLS, Storage com policies, seed dos 5 produtos, smoke test, primeiro admin
- [ ] **Plano 02 — Public site:** landing single-page, PDP `/produtos/[slug]`, sitemap, OG images
- [ ] **Plano 03 — Admin:** auth, shell admin, CRUD de produtos com upload de imagens, CRUD de categorias
- [ ] **Plano 04 — Deploy + cleanup:** Vercel, custom domain, smoke em produção, remoção da reference

A spec viva está em `docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md`.
