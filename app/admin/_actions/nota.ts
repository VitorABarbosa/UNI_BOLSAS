'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { emProducao, emitirNotaFocus, faltaParaEmitir, focusConfigurada } from '@/lib/automacao/focus';
import type { Pagamento } from '@/lib/checkout/mercadopago';
import { STORE } from '@/lib/content/store';
import { categoriasComNcm, lerNcms, ncmValido, salvarNcms } from '@/lib/automacao/ncm';
import { revalidatePath } from 'next/cache';

export type ResultadoTeste = { ok: true; numero: string; chave: string; ref: string } | { ok: false; erro: string };

/**
 * Emite uma nota de TESTE (homologação: sem valor fiscal) com um pedido de
 * exemplo, pra conferir certificado, NCM, CFOP e impostos antes de ligar
 * as notas de verdade. Só funciona com a Focus em homologação.
 */
export async function emitirNotaDeTeste(): Promise<ResultadoTeste> {
  await requireAdmin();
  if (!focusConfigurada()) return { ok: false, erro: 'Coloque o FOCUSNFE_TOKEN (de homologação) na Hostinger primeiro.' };
  if (emProducao()) return { ok: false, erro: 'A Focus está em produção: o teste só roda em homologação (nota sem valor fiscal).' };
  const falta = await faltaParaEmitir();
  if (falta) return { ok: false, erro: falta };

  const ref = `TESTE${Date.now().toString(36).toUpperCase()}`;
  // A peça de exemplo usa o NCM da primeira categoria configurada.
  const ncm = Object.values(await lerNcms())[0] || (process.env.NFE_NCM ?? '').replace(/\D/g, '');
  const c = STORE.coleta;
  const exemplo: Pagamento = {
    id: 1,
    status: 'approved',
    external_reference: ref,
    date_created: new Date().toISOString(),
    date_approved: new Date().toISOString(),
    transaction_amount: 174,
    payment_type_id: 'bank_transfer',
    metadata: {
      empresa: 'Loja de teste',
      cnpj: STORE.cnpj,
      entrega: 'envio',
      frete_valor: 24,
      nf_rua: c.logradouro,
      nf_numero: c.numero,
      nf_bairro: c.bairro,
      nf_cidade: c.municipio,
      nf_uf: c.uf,
      nf_cep: c.cep,
      nf_ie: STORE.inscricaoEstadual,
    },
    additional_info: {
      items: [{ id: 'TESTE1', title: 'Bolsa de teste', quantity: 3, unit_price: 50 }],
    },
  };
  try {
    const nota = await emitirNotaFocus(exemplo, { teste: true, ref, ncms: new Map([['TESTE1', ncm]]) });
    return { ok: true, numero: nota.numero, chave: nota.chave, ref };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Não deu certo.' };
  }
}

export type ResultadoNcm = { ok: true } | { ok: false; erro: string };

/** Salva o NCM de cada categoria (8 números; vazio = sem NCM). */
export async function salvarNcmPorCategoria(valores: Record<string, string>): Promise<ResultadoNcm> {
  await requireAdmin();
  const categorias = await categoriasComNcm();
  const mapa: Record<string, string> = {};
  for (const c of categorias) {
    const v = String(valores[c.id] ?? '').replace(/\D/g, '');
    if (!v) continue;
    if (!ncmValido(v)) return { ok: false, erro: `O NCM de ${c.nome} precisa ter 8 números (ex.: 4202.22.10).` };
    mapa[c.id] = v;
  }
  await salvarNcms(mapa);
  revalidatePath('/admin/integracoes');
  return { ok: true };
}
