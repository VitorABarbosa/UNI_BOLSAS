'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  FileSpreadsheet,
  Home,
  Menu,
  Package,
  Percent,
  PlugZap,
  Receipt,
  ShoppingBag,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from './SignOutButton';

/** O menu, em grupos: o dia a dia (vendas) primeiro, o catálogo depois. */
const GRUPOS = [
  {
    titulo: 'Vendas',
    itens: [
      { href: '/admin', label: 'Início', icon: Home, exact: true },
      { href: '/admin/pedidos', label: 'Pedidos', icon: Receipt, exact: false },
      { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
    ],
  },
  {
    titulo: 'Catálogo',
    itens: [
      { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
      { href: '/admin/categorias', label: 'Categorias', icon: Tag, exact: false },
      { href: '/admin/campanhas', label: 'Campanhas', icon: Percent, exact: false },
      { href: '/admin/importar', label: 'Importar planilha', icon: FileSpreadsheet, exact: false },
    ],
  },
  {
    titulo: 'Loja',
    itens: [
      { href: '/admin/dados', label: 'Visitas do site', icon: BarChart3, exact: false },
      { href: '/admin/integracoes', label: 'Integrações', icon: PlugZap, exact: false },
      { href: '/admin/shopee', label: 'Shopee', icon: ShoppingBag, exact: false },
    ],
  },
] as const;

/** As abas fixas do celular: o que se usa todo dia. */
const ABAS = [
  { href: '/admin', label: 'Início', icon: Home, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: Receipt, exact: false },
  { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, exact: false },
] as const;

function Navegacao({ pathname, aoClicar }: { pathname: string; aoClicar?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Menu do painel">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <div className="px-3 pb-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-stone/80">{g.titulo}</div>
          <div className="space-y-0.5">
            {g.itens.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={aoClicar}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    active ? 'bg-leather/10 font-medium text-leather-dark' : 'text-stone hover:bg-whisper/40 hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone transition-colors hover:bg-whisper/40 hover:text-ink"
      >
        <ExternalLink className="h-4 w-4" />
        Ver o site
      </a>
    </nav>
  );
}

function Rodape({ email }: { email: string }) {
  return (
    <div className="border-t border-whisper p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leather text-xs font-medium text-pearl">
          {email.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-xs text-stone" title={email}>
          {email}
        </span>
      </div>
      <SignOutButton />
    </div>
  );
}

export function AdminSidebar({ user }: { user: { email: string } }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu do celular com Esc e trava a rolagem do fundo enquanto aberto.
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('keydown', esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = antes;
    };
  }, [aberto]);

  const marca = (
    <Link href="/admin" className="font-serif text-base text-ink">
      Uni Bolsas
      <span className="ml-1 text-caramel">· Admin</span>
    </Link>
  );

  return (
    <>
      {/* Computador: barra lateral fixa. */}
      <aside className="sticky top-0 hidden h-screen print:hidden w-[220px] shrink-0 flex-col border-r border-whisper bg-bone-light md:flex">
        <div className="border-b border-whisper px-5 py-4">{marca}</div>
        <Navegacao pathname={pathname} />
        <Rodape email={user.email} />
      </aside>

      {/* Celular: barra no topo + menu deslizante. */}
      <div className="sticky top-0 z-30 flex h-12 print:hidden items-center justify-between border-b border-whisper bg-bone-light px-4 md:hidden">
        {marca}
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="rounded-md p-2 text-ink hover:bg-whisper/40"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {/* Celular: barra de abas embaixo, ao alcance do polegar. "Mais" abre o
          menu completo. */}
      <nav
        aria-label="Atalhos do painel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-whisper bg-bone-light/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden"
      >
        {ABAS.map(({ href, label, icon: Icon, exact }) => {
          const ativa = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativa ? 'page' : undefined}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px]',
                ativa ? 'font-medium text-leather-dark' : 'text-stone',
              )}
            >
              <Icon className={cn('h-5 w-5', ativa && 'stroke-[2.25]')} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-expanded={aberto}
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] text-stone"
        >
          <Menu className="h-5 w-5" />
          Mais
        </button>
      </nav>
      {aberto && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-ink/40" onClick={() => setAberto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col bg-bone-light shadow-xl">
            <div className="flex items-center justify-between border-b border-whisper px-5 py-3">
              {marca}
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar menu" className="rounded-md p-1.5 hover:bg-whisper/40">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Navegacao pathname={pathname} aoClicar={() => setAberto(false)} />
            <Rodape email={user.email} />
          </div>
        </div>
      )}
    </>
  );
}
