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
    <div className="flex min-h-screen bg-bone">
      <AdminSidebar user={user} />
      <div className="flex flex-1 flex-col">
        <AdminTopbar title={title} actions={actions} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
