import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: redirects if not authenticated or not admin.
  await requireAdmin();
  return <>{children}</>;
}
