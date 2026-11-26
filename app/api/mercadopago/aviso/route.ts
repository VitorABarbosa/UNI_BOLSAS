import { after, NextResponse, type NextRequest } from 'next/server';
import { processarPedido } from '@/lib/automacao/pedido';
import { assinaturaValida, buscarPagamento, entregaEmTexto, formaDePagamento, pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import { enviarEmail } from '@/lib/contas/email';
import { formatPriceBRL } from '@/lib/format';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { STORE } from '@/lib/content/store';
import { SITE_URL } from '@/lib/seo';

/**
 * Aviso do Mercado Pago (webhook): chamado a cada mudança num pagamento.
 *
 * Segurança:
 *  - com `MERCADOPAGO_WEBHOOK_SECRET` configurado, aviso sem assinatura
 *    válida é ignorado;
 *  - de qualquer forma, o aviso só traz o NÚMERO do pagamento. Os dados
 *    (status, valor, cliente) são buscados na API do Mercado Pago com o
 *    nosso token. Um aviso forjado não consegue inventar uma venda.
 *
 * Quando um pagamento do site é aprovado, manda:
 *  - pra loja (`PEDIDOS_EMAIL`): o pedido completo, com os dados da cliente;
 *  - pra cliente: a confirmação.
 *
 * O Mercado Pago repete o aviso várias vezes. A lista abaixo evita e-mail
 * repetido enquanto o servidor estiver de pé; depois de um reinício, um aviso
 * repetido de um pagamento de mais de 2 dias é ignorado.
 */
const jaAvisados = new Set<string>();
const DOIS_DIAS = 2 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const tipo = q.get('type') ?? q.get('topic');
  const dataId = q.get('data.id') ?? q.get('id');
  // Respostas sempre 200 para avisos que não nos interessam: senão o
  // Mercado Pago fica repetindo.
  if (tipo !== 'payment' || !dataId) return NextResponse.json({ ok: true });

  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (segredo) {
    const ok = assinaturaValida({
      assinatura: req.headers.get('x-signature'),
      requestId: req.headers.get('x-request-id'),
      dataId,
      segredo,
    });
    if (!ok) return NextResponse.json({ ok: true, ignorado: 'assinatura' });
  }

  let pagamento: Pagamento | null;
  try {
    pagamento = await buscarPagamento(dataId);
  } catch (e) {
    console.error('[aviso] consulta ao Mercado Pago falhou:', e instanceof Error ? e.message : e);
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!pagamento || !pagamento.external_reference || !REF_PEDIDO.test(pagamento.external_reference)) {
    return NextResponse.json({ ok: true });
  }
  if (pagamento.status !== 'approved') return NextResponse.json({ ok: true });

  // Nota fiscal e etiqueta, depois de responder (o Mercado Pago não espera a
  // SEFAZ). É seguro repetir: cada passo só roda se ainda não deu certo.
  const aprovado = pagamento;
  after(() => processarPedido(aprovado).then(() => undefined));

  const id = String(pagamento.id);
  const aprovadoEm = pagamento.date_approved ? Date.parse(pagamento.date_approved) : Date.now();
  if (jaAvisados.has(id) || Date.now() - aprovadoEm > DOIS_DIAS) return NextResponse.json({ ok: true });
  jaAvisados.add(id);

  await avisarVenda(pagamento);
  return NextResponse.json({ ok: true });
}

async function avisarVenda(p: Pagamento) {
  const m = p.metadata ?? {};
  const ref = p.external_reference!;
  const itens = pecasDoPagamento(p).map(
    (i) => `${Number(i.quantity)} × ${i.title} — ${formatPriceBRL(Number(i.unit_price) * Number(i.quantity))}`,
  );
  const entrega = m.entrega === 'retirada' ? `Retirada na loja (${STORE.unitText})` : entregaEmTexto(m);
  const total = `${formaDePagamento(p)} · ${formatPriceBRL(p.transaction_amount)}`;

  const loja = (process.env.PEDIDOS_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (loja.length > 0) {
    await enviarEmail({
      para: loja,
      assunto: `Nova venda ${ref} · ${formatPriceBRL(p.transaction_amount)} · ${m.empresa ?? ''}`,
      titulo: `Nova venda · ${ref}`,
      paragrafos: [
        `Pagamento aprovado: ${total}.`,
        `Cliente: ${m.empresa ?? '—'} · CNPJ ${m.cnpj ?? '—'}`,
        `Contato: ${m.cliente_nome ?? '—'} · ${m.telefone ?? '—'} · ${m.cliente_email ?? '—'}`,
        entrega,
        'Separar:',
        ...itens,
      ],
      botao: { texto: 'Abrir no painel', url: `${SITE_URL}/admin/pedidos` },
      rodape: `Pagamento Mercado Pago nº ${p.id}. Responda este e-mail para falar direto com a cliente.`,
      responderPara: m.cliente_email,
    });
  } else {
    console.warn(`[aviso] venda ${ref} aprovada, mas PEDIDOS_EMAIL não está configurado.`);
  }

  if (m.cliente_email) {
    await enviarEmail({
      para: m.cliente_email,
      assunto: `Pedido ${ref} confirmado · Uni Bolsas`,
      titulo: 'Pedido confirmado!',
      paragrafos: [
        `Recebemos seu pagamento: ${total}.`,
        ...itens,
        m.entrega === 'retirada'
          ? `Vamos separar suas peças e avisar por e-mail quando estiverem prontas para retirar no ${STORE.name}, ${STORE.unitText}.`
          : m.entrega === 'envio'
            ? `Vamos separar e postar suas peças (${m.frete}). Você recebe por e-mail a nota fiscal, o código de rastreio e o aviso de entrega.`
            : 'Vamos separar suas peças e chamar você no WhatsApp para combinar o frete.',
      ],
      botao: { texto: 'Ver meu pedido', url: `${SITE_URL}/pedido/${ref}` },
      rodape: 'Dúvidas sobre o pedido? Responda este e-mail ou fale com a gente no WhatsApp.',
    });
  }
}
