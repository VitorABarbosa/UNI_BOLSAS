import 'server-only';
import { carregarPedidos, type PedidoAdmin } from '@/lib/admin/pedidos';
import { gravarJson, lerJson } from '@/lib/automacao/armazem';
import { emailsDaLoja } from '@/lib/automacao/pedido';
import { pecasDoPagamento } from '@/lib/checkout/mercadopago';
import { enviarEmail } from '@/lib/contas/email';
import { formatPriceBRL } from '@/lib/format';
import { SITE_URL } from '@/lib/seo';
import { avisarNoCelular } from '@/lib/notificar/celular';

/**
 * Resumos automáticos para a loja, no celular (notificação) e por e-mail:
 *  - do dia: a partir das 20h (horário de Brasília), uma vez por dia;
 *  - da semana: segunda-feira a partir das 8h, comparando com a anterior.
 *
 * Roda junto da checagem de hora em hora. O GitHub às vezes atrasa a
 * checagem; por isso vale "a partir de", e um arquivo marca o que já saiu.
 */
const TZ = 'America/Sao_Paulo';
const diaSP = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const horaSP = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23', weekday: 'short' });
const curto = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
const DIA = 24 * 60 * 60 * 1000;

const quando = (p: PedidoAdmin) => new Date(p.pagamento.date_approved ?? p.pagamento.date_created);
const pagos = (lista: PedidoAdmin[]) => lista.filter((p) => p.pagamento.status === 'approved');
const soma = (lista: PedidoAdmin[]) => lista.reduce((s, p) => s + p.pagamento.transaction_amount, 0);
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function topPecas(lista: PedidoAdmin[], n = 5) {
  const mapa = new Map<string, number>();
  for (const p of lista)
    for (const i of pecasDoPagamento(p.pagamento)) {
      const nome = String(i.title ?? '').split(' · ')[0] || 'Peça';
      mapa.set(nome, (mapa.get(nome) ?? 0) + (Number(i.quantity) || 0));
    }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function aFazer(lista: PedidoAdmin[]) {
  const n = (f: PedidoAdmin['fila']) => lista.filter((p) => p.fila === f).length;
  return { separar: n('separar'), postar: n('postar'), retirar: n('retirar'), problema: n('problema'), aguardando: n('aguardando') };
}

function linhaAFazer(f: ReturnType<typeof aFazer>) {
  const partes = [
    f.separar && `${f.separar} pra separar`,
    f.postar && `${f.postar} pra postar`,
    f.retirar && `${f.retirar} esperando retirada`,
    f.problema && `${f.problema} com problema`,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Nada pendente.';
}

export async function resumoDoDia(agora = new Date()) {
  const { pedidos, erro } = await carregarPedidos();
  if (erro) throw new Error(erro);
  const hoje = diaSP.format(agora);
  const vendas = pagos(pedidos).filter((p) => diaSP.format(quando(p)) === hoje);
  const f = aFazer(pedidos);
  const total = soma(vendas);
  const titulo = vendas.length ? `📊 Hoje: ${plural(vendas.length, 'venda', 'vendas')} · ${formatPriceBRL(total)}` : '📊 Hoje: nenhuma venda pelo site';
  const texto = linhaAFazer(f);
  const paragrafos = [
    vendas.length
      ? `${plural(vendas.length, 'pedido pago', 'pedidos pagos')} hoje, somando ${formatPriceBRL(total)}.`
      : 'Nenhum pedido pago pelo site hoje.',
    ...vendas.map((p) => {
      const m = p.pagamento.metadata ?? {};
      return `• ${m.empresa || m.cliente_nome || p.ref} — ${formatPriceBRL(p.pagamento.transaction_amount)} (${m.entrega === 'retirada' ? 'retirada' : 'envio'})`;
    }),
    `Pra fazer: ${texto}`,
    f.aguardando ? `${plural(f.aguardando, 'pedido', 'pedidos')} aguardando pagamento (Pix/boleto).` : '',
  ].filter(Boolean);
  return { titulo, texto, paragrafos, url: '/admin' };
}

export async function resumoDaSemana(agora = new Date()) {
  const { pedidos, erro } = await carregarPedidos();
  if (erro) throw new Error(erro);
  const fim = agora.getTime();
  const semana = pagos(pedidos).filter((p) => fim - quando(p).getTime() < 7 * DIA);
  const anterior = pagos(pedidos).filter((p) => fim - quando(p).getTime() >= 7 * DIA && fim - quando(p).getTime() < 14 * DIA);
  const total = soma(semana);
  const totalAnt = soma(anterior);
  const variacao = totalAnt > 0 ? Math.round(((total - totalAnt) / totalAnt) * 100) : null;
  const ticket = semana.length ? total / semana.length : 0;
  const top = topPecas(semana);
  const periodo = `${curto.format(new Date(fim - 6 * DIA))} a ${curto.format(agora)}`;
  const titulo = `📈 Semana: ${plural(semana.length, 'venda', 'vendas')} · ${formatPriceBRL(total)}`;
  const texto =
    (variacao === null ? '' : `${variacao >= 0 ? '+' : ''}${variacao}% vs. semana anterior · `) +
    (top[0] ? `mais vendida: ${top[0][0]}` : 'sem vendas na semana');
  const paragrafos = [
    `Semana de ${periodo}: ${plural(semana.length, 'pedido pago', 'pedidos pagos')}, ${formatPriceBRL(total)}.`,
    `Semana anterior: ${plural(anterior.length, 'pedido', 'pedidos')}, ${formatPriceBRL(totalAnt)}${variacao === null ? '' : ` (${variacao >= 0 ? '+' : ''}${variacao}%)`}.`,
    semana.length ? `Ticket médio: ${formatPriceBRL(ticket)}.` : '',
    top.length ? 'Mais vendidas:' : '',
    ...top.map(([nome, qtd], i) => `${i + 1}. ${nome} — ${qtd} un.`),
    `Pra fazer agora: ${linhaAFazer(aFazer(pedidos))}`,
  ].filter(Boolean);
  return { titulo, texto, paragrafos, url: '/admin' };
}

async function mandar(r: { titulo: string; texto: string; paragrafos: string[]; url: string }, etiqueta: string) {
  const loja = emailsDaLoja();
  if (loja.length) {
    await enviarEmail({
      para: loja,
      assunto: r.titulo.replace(/^\S+\s/, ''),
      titulo: r.titulo.replace(/^\S+\s/, ''),
      paragrafos: r.paragrafos,
      botao: { texto: 'Abrir o painel', url: `${SITE_URL}/admin` },
      rodape: 'Resumo automático da Uni Bolsas.',
    }).catch(() => false);
  }
  await avisarNoCelular({ titulo: r.titulo, texto: r.texto, url: r.url, etiqueta });
}

/** Manda o que estiver na hora e ainda não saiu. Chamado de hora em hora. */
export async function enviarResumosNaHora(agora = new Date()): Promise<string[]> {
  const feitos: string[] = [];
  const partes = Object.fromEntries(horaSP.formatToParts(agora).map((p) => [p.type, p.value]));
  const hora = Number(partes.hour);
  const hoje = diaSP.format(agora);
  if (hora >= 20) {
    const marca = `relatorios/diario-${hoje}.json`;
    if (!(await lerJson(marca))) {
      await mandar(await resumoDoDia(agora), 'resumo-dia');
      await gravarJson(marca, { em: agora.toISOString() });
      feitos.push('diario');
    }
  }
  if (partes.weekday === 'Mon' && hora >= 8) {
    const marca = `relatorios/semanal-${hoje}.json`;
    if (!(await lerJson(marca))) {
      await mandar(await resumoDaSemana(agora), 'resumo-semana');
      await gravarJson(marca, { em: agora.toISOString() });
      feitos.push('semanal');
    }
  }
  return feitos;
}

/** Botão do painel: manda o resumo agora (pra conferir como chega). */
export async function enviarResumoAgora(tipo: 'dia' | 'semana') {
  await mandar(tipo === 'dia' ? await resumoDoDia() : await resumoDaSemana(), tipo === 'dia' ? 'resumo-dia' : 'resumo-semana');
}
