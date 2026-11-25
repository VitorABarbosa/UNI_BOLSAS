import 'server-only';
import { lerJson, gravarJson } from '@/lib/automacao/armazem';
import { blingConectado, blingConfigurado, emitirNota, ErroAutomacao, type NotaEmitida } from '@/lib/automacao/bling';
import { gerarEtiqueta, rastreios } from '@/lib/automacao/etiqueta';
import { melhorEnvioConfigurado } from '@/lib/frete/melhorenvio';
import { enviarEmail } from '@/lib/contas/email';
import { SITE_URL } from '@/lib/seo';
import type { Pagamento } from '@/lib/checkout/mercadopago';
import type { Volume } from '@/lib/frete/caixas';

/**
 * O que acontece depois que um pedido é pago, sozinho:
 *   1. NF-e no Bling (autorizada na SEFAZ);
 *   2. se for envio: etiqueta no Melhor Envio, com a chave da nota;
 *   3. e-mail pra cliente com a nota (e, depois, o rastreio).
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

/** Atualiza os rastreios (chamado ao abrir o pedido/painel; barato). */
export async function atualizarRastreio(estado: EstadoPedido): Promise<EstadoPedido> {
  if (!estado.etiqueta?.envios.length || !melhorEnvioConfigurado()) return estado;
  try {
    const codigos = await rastreios(estado.etiqueta.envios);
    if (codigos.length && codigos.join() !== (estado.rastreio ?? []).join()) {
      estado.rastreio = codigos;
      await salvar(estado);
    }
  } catch {
    // Sem rastreio ainda (etiqueta não postada): não é erro.
  }
  return estado;
}
