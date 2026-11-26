import 'server-only';
import { lerJson, gravarJson } from '@/lib/automacao/armazem';
import { enviarEmail } from '@/lib/contas/email';
import { formatPriceBRL } from '@/lib/format';
import { listarPagamentos, pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { SITE_URL } from '@/lib/seo';

/**
 * Lembrete de pagamento: a cliente gerou o Pix ou o boleto e não pagou.
 * Depois de algumas horas, um e-mail (um só por pedido) com o link para
 * pagar. Roda na checagem de hora em hora.
 */
const ESPERA_HORAS = 3;
const LIMITE_DIAS = 3;
const caminho = (ref: string) => `lembretes/${ref}.json`;

/** O link que leva direto ao pagamento (QR do Pix ou boleto). */
export function linkParaPagar(p: Pagamento): string | null {
  return p.point_of_interaction?.transaction_data?.ticket_url || p.transaction_details?.external_resource_url || null;
}

export async function lembrarPagamentosPendentes(agora = Date.now()): Promise<number> {
  const pagamentos = (await listarPagamentos(200)).filter((p) => p.external_reference && REF_PEDIDO.test(p.external_reference));
  const porRef = new Map<string, Pagamento[]>();
  for (const p of pagamentos) porRef.set(p.external_reference!, [...(porRef.get(p.external_reference!) ?? []), p]);

  let enviados = 0;
  for (const [ref, lista] of porRef) {
    // Já pagou (ou está em análise) por outro meio: nada a lembrar.
    if (lista.some((p) => ['approved', 'authorized', 'in_process'].includes(p.status))) continue;
    const pendente = lista.find(
      (p) =>
        p.status === 'pending' &&
        (p.payment_type_id === 'bank_transfer' || p.payment_type_id === 'ticket') &&
        (!p.date_of_expiration || Date.parse(p.date_of_expiration) > agora),
    );
    if (!pendente) continue;
    const idade = agora - Date.parse(pendente.date_created);
    if (idade < ESPERA_HORAS * 60 * 60 * 1000 || idade > LIMITE_DIAS * 24 * 60 * 60 * 1000) continue;
    const email = pendente.metadata?.cliente_email;
    if (!email || (await lerJson(caminho(ref)))) continue;

    const nome = String(pendente.metadata?.cliente_nome ?? '').trim().split(/\s+/)[0];
    const pix = pendente.payment_type_id === 'bank_transfer';
    const link = linkParaPagar(pendente);
    const pecas = pecasDoPagamento(pendente);
    const ok = await enviarEmail({
      para: email,
      assunto: `Seu pedido ${ref} está esperando o pagamento · Uni Bolsas`,
      titulo: 'Falta só o pagamento',
      paragrafos: [
        nome ? `Olá, ${nome}!` : 'Olá!',
        `Seu pedido ${ref} (${pecas.reduce((s, i) => s + Number(i.quantity), 0)} peças · ${formatPriceBRL(pendente.transaction_amount)}) ainda não foi pago.`,
        pix
          ? 'Se ainda quiser as peças, é só pagar o Pix pelo botão abaixo. Assim que o pagamento cair, a gente separa e você recebe a confirmação.'
          : 'Se ainda quiser as peças, é só pagar o boleto pelo botão abaixo. A compensação leva até 2 dias úteis.',
        'Se já pagou, pode ignorar este e-mail.',
      ],
      botao: { texto: pix ? 'Pagar com Pix' : 'Ver o boleto', url: link ?? `${SITE_URL}/pedido/${ref}` },
      rodape: 'Dúvidas? Responda este e-mail ou fale com a gente no WhatsApp.',
    }).catch(() => false);
    if (ok) {
      await gravarJson(caminho(ref), { em: new Date(agora).toISOString(), pagamento: pendente.id });
      enviados++;
    }
  }
  return enviados;
}
