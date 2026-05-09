import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';

export const metadata = {
  title: 'Dashboard · Uni Bolsas Admin',
};

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Dashboard">
      <div className="p-6">
        <p className="text-stone">Em breve…</p>
      </div>
    </AdminShell>
  );
}
