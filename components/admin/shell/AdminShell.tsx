import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({
  user,
  title,
  actions,
  children,
}: {
  user: { email: string };
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bone md:flex">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={title} actions={actions} />
        <main className="min-w-0 flex-1 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0 print:pb-0">{children}</main>
      </div>
    </div>
  );
}
