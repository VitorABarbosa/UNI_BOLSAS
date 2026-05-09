'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from './SignOutButton';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/produtos', label: 'Produtos', icon: Package, exact: false },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag, exact: false },
] as const;

export function AdminSidebar({ user }: { user: { email: string } }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] flex-col border-r border-whisper bg-bone-light">
      <div className="border-b border-whisper px-5 py-4">
        <Link href="/admin" className="font-serif text-base text-ink">
          Uni Bolsas
          <span className="ml-1 text-caramel">· Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-leather/10 text-leather-dark font-medium'
                  : 'text-stone hover:bg-whisper/40 hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-whisper p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-leather text-xs font-medium text-pearl">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-xs text-stone" title={user.email}>
            {user.email}
          </span>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
