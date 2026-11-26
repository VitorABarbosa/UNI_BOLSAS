'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/require-admin';
import { pagamentosDoPedido } from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { lerEstado, marcarEntregue, marcarEnviado, marcarProntoParaRetirar, marcarRetirado, processarPedido } from '@/lib/automacao/pedido';
import { linkDeImpressao } from '@/lib/automacao/etiqueta';

export type RespostaAdmin = { ok: true; url?: string } | { ok: false; erro: string };

/** Roda de novo os passos que faltaram (nota e/ou etiqueta). */
export async function tentarDeNovo(ref: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  const pago = (await pagamentosDoPedido(ref)).find((p) => p.status === 'approved');
  if (!pago) return { ok: false, erro: 'Este pedido não tem pagamento aprovado.' };
  const e = await processarPedido(pago);
  revalidatePath('/admin/pedidos', 'layout');
  return e?.erro ? { ok: false, erro: e.erro.mensagem } : { ok: true };
}

/** Link do PDF da etiqueta (o Melhor Envio gera um link novo a cada pedido). */
export async function imprimirEtiqueta(ref: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  const e = await lerEstado(ref);
  if (!e?.etiqueta?.envios.length) return { ok: false, erro: 'A etiqueta ainda não foi gerada.' };
  try {
    return { ok: true, url: await linkDeImpressao(e.etiqueta.envios) };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Falha ao gerar o PDF.' };
  }
}

/** Retirada: avisa a cliente (e-mail) que o pedido está separado. */
export async function avisarPronto(ref: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  try {
    await marcarProntoParaRetirar(ref);
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Não deu certo.' };
  }
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}

/** Retirada: a cliente buscou as peças. */
export async function confirmarRetirada(ref: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  try {
    await marcarRetirado(ref);
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Não deu certo.' };
  }
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}

/** Envio por fora da automação: informa o código e avisa a cliente. */
export async function informarEnvio(ref: string, codigos: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  const lista = String(codigos ?? '')
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (lista.length === 0 || lista.some((c) => !/^[A-Z0-9-]{6,40}$/.test(c))) {
    return { ok: false, erro: 'Digite o código de rastreio (só letras e números).' };
  }
  try {
    await marcarEnviado(ref, lista);
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Não deu certo.' };
  }
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}

/** A loja confirma a entrega. */
export async function confirmarEntrega(ref: string): Promise<RespostaAdmin> {
  await requireAdmin();
  if (!REF_PEDIDO.test(ref)) return { ok: false, erro: 'Pedido inválido.' };
  try {
    await marcarEntregue(ref);
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : 'Não deu certo.' };
  }
  revalidatePath('/admin/pedidos', 'layout');
  return { ok: true };
}
