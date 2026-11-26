import 'server-only';
import { blingConectado, blingConfigurado } from '@/lib/automacao/bling';

/**
 * O que está ligado e o que falta, numa lista que a loja entende. Só olha se
 * as variáveis EXISTEM: nenhum valor sai daqui.
 */
export type ItemStatus = { nome: string; ok: boolean; texto: string; falta?: string };

export async function statusDasIntegracoes(): Promise<ItemStatus[]> {
  const tem = (v: string) => !!process.env[v];
  const bling = blingConfigurado() ? await blingConectado().catch(() => ({ conectado: false as const, desde: undefined })) : null;
  return [
    {
      nome: 'Pagamentos (Mercado Pago)',
      ok: tem('MERCADOPAGO_ACCESS_TOKEN') && tem('MERCADOPAGO_WEBHOOK_SECRET'),
      texto: 'Recebe Pix, cartão e boleto e avisa o site de cada pagamento.',
      falta: !tem('MERCADOPAGO_ACCESS_TOKEN') ? 'Falta MERCADOPAGO_ACCESS_TOKEN na Hostinger.' : !tem('MERCADOPAGO_WEBHOOK_SECRET') ? 'Falta MERCADOPAGO_WEBHOOK_SECRET na Hostinger.' : undefined,
    },
    {
      nome: 'E-mails (Resend)',
      ok: tem('RESEND_API_KEY') && tem('PEDIDOS_EMAIL'),
      texto: 'Confirmação, nota, rastreio e entrega para a cliente; aviso de venda para a loja.',
      falta: !tem('RESEND_API_KEY') ? 'Falta RESEND_API_KEY na Hostinger.' : !tem('PEDIDOS_EMAIL') ? 'Falta PEDIDOS_EMAIL (o e-mail que recebe as vendas).' : undefined,
    },
    {
      nome: 'Frete e etiquetas (Melhor Envio)',
      ok: tem('MELHORENVIO_TOKEN'),
      texto: 'Calcula o frete no checkout e compra a etiqueta depois da nota.',
      falta: tem('MELHORENVIO_TOKEN') ? undefined : 'Falta MELHORENVIO_TOKEN na Hostinger.',
    },
    {
      nome: 'Nota fiscal (Bling)',
      ok: !!bling?.conectado,
      texto: bling?.conectado && bling.desde ? `Conectado desde ${new Date(bling.desde).toLocaleDateString('pt-BR')}.` : 'Emite a NF-e de cada venda paga.',
      falta: !bling ? 'Falta BLING_CLIENT_ID e BLING_CLIENT_SECRET na Hostinger.' : !bling.conectado ? 'Clique em "Conectar Bling" abaixo.' : undefined,
    },
    {
      nome: 'Checagem de hora em hora',
      ok: tem('CRON_SECRET'),
      texto: 'Atualiza rastreios, manda "a caminho" e "entregue" e refaz o que falhou.',
      falta: tem('CRON_SECRET') ? undefined : 'Falta CRON_SECRET na Hostinger e no GitHub.',
    },
  ];
}
