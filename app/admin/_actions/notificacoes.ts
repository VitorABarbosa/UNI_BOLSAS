'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { avisarNoCelular, chavePublica, esquecerAparelho, guardarAparelho } from '@/lib/notificar/celular';

const assinaturaSchema = z.object({
  endpoint: z.string().url().max(1000),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(8).max(100) }),
});

export async function chaveDasNotificacoes(): Promise<string> {
  await requireAdmin();
  return chavePublica();
}

export async function ativarNotificacoes(assinatura: unknown, nome: string): Promise<{ ok: boolean; erro?: string }> {
  const { user } = await requireAdmin();
  const p = assinaturaSchema.safeParse(assinatura);
  if (!p.success) return { ok: false, erro: 'O navegador mandou uma inscrição inválida. Tente de novo.' };
  try {
    await guardarAparelho({
      sub: { endpoint: p.data.endpoint, keys: p.data.keys },
      nome: String(nome ?? '').slice(0, 60) || 'Celular',
      email: user.email ?? '',
      desde: new Date().toISOString(),
    });
    await avisarNoCelular(
      { titulo: 'Notificações ligadas ✓', texto: 'Você vai receber aqui as vendas, os problemas e o resumo do dia.', url: '/admin' },
      p.data.endpoint,
    );
    return { ok: true };
  } catch (e) {
    console.error('[notificacoes] ativar:', e instanceof Error ? e.message : e);
    return { ok: false, erro: 'Não deu para salvar agora. Tente de novo em instantes.' };
  }
}

export async function desativarNotificacoes(endpoint: string): Promise<void> {
  await requireAdmin();
  await esquecerAparelho(String(endpoint ?? ''));
}

export async function testarNotificacao(endpoint: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const n = await avisarNoCelular(
    { titulo: '💰 Nova venda · R$ 209,97 (teste)', texto: 'Loja da Ana · 3 peças · Pix · Retirada na loja', url: '/admin/pedidos', etiqueta: 'teste' },
    String(endpoint ?? ''),
  );
  return { ok: n > 0 };
}

export async function mandarResumoAgora(tipo: 'dia' | 'semana'): Promise<{ ok: boolean; erro?: string }> {
  await requireAdmin();
  try {
    const { enviarResumoAgora } = await import('@/lib/notificar/resumos');
    await enviarResumoAgora(tipo === 'semana' ? 'semana' : 'dia');
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Não deu para montar o resumo agora.' };
  }
}
