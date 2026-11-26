import 'server-only';
import { lerJson, gravarJson, listarJson } from '@/lib/automacao/armazem';
import { blingConectado, blingConfigurado, emitirNota, ErroAutomacao, type NotaEmitida } from '@/lib/automacao/bling';
import { gerarEtiqueta, situacaoEnvios } from '@/lib/automacao/etiqueta';
import { linkDeRastreio } from '@/lib/automacao/rastreio-link';
import { melhorEnvioConfigurado } from '@/lib/frete/melhorenvio';
import { enviarEmail } from '@/lib/contas/email';
import { SITE_URL } from '@/lib/seo';
import { pagamentosDoPedido, type Pagamento } from '@/lib/checkout/mercadopago';
import { STORE } from '@/lib/content/store';
import type { Volume } from '@/lib/frete/caixas';

/**
 * O que acontece depois que um pedido é pago, sozinho:
 *   1. NF-e no Bling (autorizada na SEFAZ);
 *   2. se for envio: etiqueta no Melhor Envio, com a chave da nota;
 *   3. e-mail pra cliente com a nota;
 *   4. depois, de hora em hora (`/api/automacao/rastreio`): rastreio e
 *      e-mails de "postado" e "entregue".
 *
 * O andamento fica num JSON privado por pedido (`pedidos/UB-….json`). Cada
 * passo só roda se ainda não deu certo, então o aviso repetido do Mercado
 * Pago ou o "Tentar de novo" do painel nunca emitem duas notas nem compram
 * duas etiquetas.
 */

export type EstadoPedido = {
  ref: string;
  pagamentoId: number;
  nota?: NotaEmitida;
  etiqueta?: { envios: string[]; servico: string; em: string };
  rastreio?: string[];
  erro?: { etapa: 'nota' | 'etiqueta'; mensagem: string; em: string };
  notaAvisada?: boolean;
  /** Pra mandar os e-mails de atualização sem consultar o Mercado Pago. */
  cliente?: { email: string; nome?: string; entrega?: string };
  /** Envio: quando a transportadora recebeu e quando entregou. */
  postadoEm?: string;
  entregueEm?: string;
  /** Retirada: quando a loja avisou que está pronto e quando a cliente retirou. */
  prontoEm?: string;
  retiradoEm?: string;
  /** E-mails de atualização já mandados (cada um uma vez só). */
  avisos?: { postado?: boolean; entregue?: boolean; pronto?: boolean };
  atualizadoEm: string;
};

const caminho = (ref: string) => `pedidos/${ref}.json`;

export async function lerEstado(ref: string): Promise<EstadoPedido | null> {
  return lerJson<EstadoPedido>(caminho(ref));
}

async function salvar(e: EstadoPedido) {
  e.atualizadoEm = new Date().toISOString();
  await gravarJson(caminho(e.ref), e);
}

function lerVolumes(txt: string | undefined): Volume[] | undefined {
  if (!txt) return undefined;
  const v = txt.split(';').map((parte) => {
    const [dims, peso] = parte.split(':');
    const [comprimento, largura, altura] = (dims ?? '').split('x').map(Number);
    return { caixa: '', comprimento: comprimento!, largura: largura!, altura: altura!, peso: Number(peso) };
  });
  return v.every((x) => x.comprimento > 0 && x.peso > 0) ? v : undefined;
}

/** Um processamento por pedido de cada vez (avisos chegam em rajada). */
const emAndamento = new Map<string, Promise<EstadoPedido | null>>();

export function processarPedido(p: Pagamento): Promise<EstadoPedido | null> {
  const ref = p.external_reference;
  if (!ref || p.status !== 'approved') return Promise.resolve(null);
  const atual = emAndamento.get(ref);
  if (atual) return atual;
  const tarefa = processar(p).finally(() => emAndamento.delete(ref));
  emAndamento.set(ref, tarefa);
  return tarefa;
}

async function processar(p: Pagamento): Promise<EstadoPedido | null> {
  const ref = p.external_reference!;
  const m = p.metadata ?? {};
  const estado: EstadoPedido = (await lerEstado(ref)) ?? { ref, pagamentoId: p.id, atualizadoEm: '' };
  estado.pagamentoId = p.id;
  if (m.cliente_email) estado.cliente = { email: m.cliente_email, nome: m.cliente_nome, entrega: m.entrega };

  // 1. Nota fiscal.
  if (!estado.nota) {
    if (!blingConfigurado() || !(await blingConectado()).conectado) {
      estado.erro = { etapa: 'nota', mensagem: 'O Bling ainda não está conectado: a nota não foi emitida.', em: new Date().toISOString() };
      await salvar(estado);
      return estado;
    }
    try {
      estado.nota = await emitirNota(p);
      estado.erro = undefined;
      await salvar(estado);
    } catch (e) {
      return falhou(estado, 'nota', e);
    }
  }

  // E-mail da nota pra cliente (uma vez).
  if (estado.nota && !estado.notaAvisada && m.cliente_email) {
    const ok = await enviarEmail({
      para: m.cliente_email,
      assunto: `Nota fiscal do pedido ${ref} · Uni Bolsas`,
      titulo: 'Sua nota fiscal',
      paragrafos: [
        `A NF-e nº ${estado.nota.numero} do pedido ${ref} foi emitida.`,
        `Chave de acesso: ${estado.nota.chave}`,
      ],
      botao: estado.nota.danfe ? { texto: 'Ver a nota (DANFE)', url: estado.nota.danfe } : { texto: 'Ver meu pedido', url: `${SITE_URL}/pedido/${ref}` },
      rodape: 'Guarde este e-mail: é o documento fiscal da sua compra.',
    });
    if (ok) {
      estado.notaAvisada = true;
      await salvar(estado);
    }
  }

  // 2. Etiqueta (só envio).
  if (m.entrega === 'envio' && estado.nota && !estado.etiqueta) {
    if (!melhorEnvioConfigurado() || !m.frete_servico_id) {
      estado.erro = { etapa: 'etiqueta', mensagem: 'Melhor Envio não configurado ou pedido sem serviço de frete.', em: new Date().toISOString() };
      await salvar(estado);
      return estado;
    }
    try {
      const et = await gerarEtiqueta(p, estado.nota.chave, Number(m.frete_servico_id), lerVolumes(m.volumes));
      estado.etiqueta = { ...et, em: new Date().toISOString() };
      estado.erro = undefined;
      await salvar(estado);
    } catch (e) {
      return falhou(estado, 'etiqueta', e);
    }
  }
  return estado;
}

async function falhou(estado: EstadoPedido, etapa: 'nota' | 'etiqueta', e: unknown): Promise<EstadoPedido> {
  const mensagem = e instanceof ErroAutomacao ? e.message : e instanceof Error ? `Erro inesperado: ${e.message}` : 'Erro inesperado';
  console.error(`[automacao] ${estado.ref} ${etapa}:`, mensagem);
  estado.erro = { etapa, mensagem, em: new Date().toISOString() };
  await salvar(estado);
  return estado;
}

/** Primeiro nome, pra saudação do e-mail. */
const primeiroNome = (e: EstadoPedido) => (e.cliente?.nome ?? '').trim().split(/\s+/)[0] ?? '';

/**
 * Consulta o Melhor Envio e atualiza rastreio, postagem e entrega. Manda o
 * e-mail de "postado" e o de "entregue" (uma vez cada). Chamado ao abrir o
 * pedido e de hora em hora pela checagem automática.
 */
export async function atualizarRastreio(estado: EstadoPedido): Promise<EstadoPedido> {
  if (!estado.etiqueta?.envios.length || !melhorEnvioConfigurado()) return estado;
  let mudou = false;
  try {
    const sit = await situacaoEnvios(estado.etiqueta.envios);
    const codigos = sit.map((s) => s.codigo).filter(Boolean);
    if (codigos.length && codigos.join() !== (estado.rastreio ?? []).join()) {
      estado.rastreio = codigos;
      mudou = true;
    }
    const postado = sit.some((s) => s.postadoEm || ['posted', 'delivered'].includes(s.status));
    if (postado && !estado.postadoEm) {
      estado.postadoEm = sit.map((s) => s.postadoEm).find(Boolean) ?? new Date().toISOString();
      mudou = true;
    }
    const entregue = sit.length > 0 && sit.every((s) => s.entregueEm || s.status === 'delivered');
    if (entregue && !estado.entregueEm) {
      estado.entregueEm = sit.map((s) => s.entregueEm).find(Boolean) ?? new Date().toISOString();
      mudou = true;
    }
  } catch {
    // Sem rastreio ainda (etiqueta não postada) ou Melhor Envio fora: tenta na próxima.
  }

  const email = estado.cliente?.email;
  const ola = primeiroNome(estado) ? `Olá, ${primeiroNome(estado)}!` : 'Olá!';
  const verPedido = { texto: 'Acompanhar meu pedido', url: `${SITE_URL}/pedido/${estado.ref}` };
  if (email && estado.postadoEm && estado.rastreio?.length && !estado.avisos?.postado && !estado.entregueEm) {
    const ok = await enviarEmail({
      para: email,
      assunto: `Pedido ${estado.ref} a caminho · Uni Bolsas`,
      titulo: 'Seu pedido está a caminho',
      paragrafos: [
        ola,
        `Postamos o pedido ${estado.ref}${estado.etiqueta.servico ? ` (${estado.etiqueta.servico})` : ''}.`,
        `Código de rastreio: ${estado.rastreio.join(', ')}`,
        `Acompanhe a entrega: ${linkDeRastreio(estado.rastreio[0]!)}`,
      ],
      botao: verPedido,
      rodape: 'Avisamos de novo por e-mail quando a entrega for concluída.',
    });
    if (ok) {
      estado.avisos = { ...estado.avisos, postado: true };
      mudou = true;
    }
  }
  if (email && estado.entregueEm && !estado.avisos?.entregue) {
    const ok = await enviarEmail({
      para: email,
      assunto: `Pedido ${estado.ref} entregue · Uni Bolsas`,
      titulo: 'Pedido entregue!',
      paragrafos: [
        ola,
        `A transportadora confirmou a entrega do pedido ${estado.ref}.`,
        'Confira as peças. Se alguma vier com defeito, fale com a gente em até 7 dias.',
      ],
      botao: verPedido,
      rodape: 'Obrigado por comprar com a Uni Bolsas.',
    });
    if (ok) {
      // O de "postado" não faz mais sentido depois de entregue.
      estado.avisos = { ...estado.avisos, entregue: true, postado: true };
      mudou = true;
    }
  }
  if (mudou) await salvar(estado);
  return estado;
}

/** Retirada: a loja avisa que está pronto (e-mail pra cliente). */
export async function marcarProntoParaRetirar(ref: string): Promise<EstadoPedido> {
  const estado = await estadoOuNovo(ref);
  estado.prontoEm ??= new Date().toISOString();
  if (estado.cliente?.email && !estado.avisos?.pronto) {
    const ola = primeiroNome(estado) ? `Olá, ${primeiroNome(estado)}!` : 'Olá!';
    const ok = await enviarEmail({
      para: estado.cliente.email,
      assunto: `Pedido ${ref} pronto para retirar · Uni Bolsas`,
      titulo: 'Pronto para retirar',
      paragrafos: [
        ola,
        `Seu pedido ${ref} está separado e esperando você.`,
        `Onde: ${STORE.name}, ${STORE.unitText} · ${STORE.street}, ${STORE.district}, ${STORE.city}.`,
        `Horário: ${STORE.hours.join(' · ')}.`,
        'Na retirada, informe o número do pedido.',
      ],
      botao: { texto: 'Ver meu pedido', url: `${SITE_URL}/pedido/${ref}` },
      rodape: 'Dúvidas? Responda este e-mail ou fale com a gente no WhatsApp.',
    });
    if (ok) estado.avisos = { ...estado.avisos, pronto: true };
  }
  await salvar(estado);
  return estado;
}

/** Retirada: a cliente buscou as peças. */
export async function marcarRetirado(ref: string): Promise<EstadoPedido> {
  const estado = await estadoOuNovo(ref);
  estado.prontoEm ??= new Date().toISOString();
  estado.retiradoEm ??= new Date().toISOString();
  await salvar(estado);
  return estado;
}

/** O andamento salvo, ou um novo a partir do pagamento aprovado. */
async function estadoOuNovo(ref: string): Promise<EstadoPedido> {
  const salvo = await lerEstado(ref);
  if (salvo?.cliente) return salvo;
  const pago = (await pagamentosDoPedido(ref)).find((p) => p.status === 'approved');
  if (!pago) throw new ErroAutomacao('Este pedido não tem pagamento aprovado.');
  const m = pago.metadata ?? {};
  const e: EstadoPedido = salvo ?? { ref, pagamentoId: pago.id, atualizadoEm: '' };
  if (m.cliente_email) e.cliente = { email: m.cliente_email, nome: m.cliente_nome, entrega: m.entrega };
  return e;
}

/**
 * A checagem de hora em hora: atualiza o rastreio dos pedidos enviados e
 * ainda não entregues, e tenta de novo nota/etiqueta que tinham falhado (ex.:
 * saldo do Melhor Envio que acabou e foi recarregado).
 */
export async function checarPedidos(): Promise<{ vistos: number; rastreados: number; refeitos: number }> {
  const LIMITE_DIAS = 45;
  const arquivos = await listarJson('pedidos');
  const recentes = arquivos.filter((a) => Date.now() - Date.parse(a.atualizadoEm) < LIMITE_DIAS * 24 * 60 * 60 * 1000);
  let rastreados = 0;
  let refeitos = 0;
  for (const a of recentes) {
    const ref = a.nome.replace(/\.json$/, '');
    const e = await lerEstado(ref).catch(() => null);
    if (!e) continue;
    try {
      if (e.erro && refeitos < 10) {
        const pago = (await pagamentosDoPedido(ref)).find((p) => p.status === 'approved');
        if (pago) {
          refeitos++;
          await processarPedido(pago);
        }
        continue;
      }
      if (e.etiqueta && !e.entregueEm) {
        rastreados++;
        await atualizarRastreio(e);
      }
    } catch (err) {
      console.error(`[checagem] ${ref}:`, err instanceof Error ? err.message : err);
    }
  }
  return { vistos: recentes.length, rastreados, refeitos };
}
