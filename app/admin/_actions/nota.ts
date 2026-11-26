'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { emProducao, emitirNotaFocus, faltaParaEmitir, focusConfigurada } from '@/lib/automacao/focus';
import type { Pagamento } from '@/lib/checkout/mercadopago';
import { STORE } from '@/lib/content/store';

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
  const falta = faltaParaEmitir();
  if (falta) return { ok: false, erro: falta };

  const ref = `TESTE${Date.now().toString(36).toUpperCase()}`;
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
    const nota = await emitirNotaFocus(exemplo, { teste: true, ref });
    return { ok: true, numero: nota.numero, chave: nota.chave, ref };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Não deu certo.' };
  }
}
