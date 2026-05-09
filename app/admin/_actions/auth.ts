'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const SignInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  next: z.string().optional(),
});

export type SignInInput = z.input<typeof SignInSchema>;

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function signInAction(input: SignInInput): Promise<ActionResult> {
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: 'Credenciais inválidas',
      fieldErrors: { password: ['credenciais inválidas'] },
    };
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: 'Usuário não autorizado',
      fieldErrors: { email: ['esta conta não tem acesso ao admin'] },
    };
  }

  redirect(parsed.data.next || '/admin');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
