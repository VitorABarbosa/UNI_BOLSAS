import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/admin/AuthForm';

export const metadata = {
  title: 'Login · Uni Bolsas Admin',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // If already logged in AND admin, skip login
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (admin) {
      redirect(next || '/admin');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bone px-4">
      <AuthForm next={next} error={error} />
    </main>
  );
}
