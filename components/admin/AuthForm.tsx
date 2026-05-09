'use client';

import { useState, useTransition } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { signInAction } from '@/app/admin/_actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const FormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormValues = z.infer<typeof FormSchema>;

export function AuthForm({
  next,
  error,
}: {
  next?: string;
  error?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [topLevelError, setTopLevelError] = useState<string | null>(
    error === 'unauthorized'
      ? 'Sua conta não tem permissão para acessar o admin.'
      : null,
  );

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(FormSchema as any) as unknown as Resolver<FormValues>,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setTopLevelError(null);
      const result = await signInAction({ ...values, next });
      // success path = redirect, function never returns ok:true here
      if (result && !result.ok) {
        setTopLevelError(result.error);
        Object.entries(result.fieldErrors ?? {}).forEach(([field, msgs]) => {
          form.setError(field as keyof FormValues, { message: msgs?.[0] });
        });
        toast.error(result.error);
      }
    });
  });

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl text-ink">Uni Bolsas · Admin</h1>
        <p className="mt-1 text-sm text-stone">Faça login para gerenciar o catálogo.</p>
      </div>

      {topLevelError && (
        <div className="mb-4 rounded-md border border-wine/30 bg-wine/5 px-3 py-2 text-sm text-wine">
          {topLevelError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
