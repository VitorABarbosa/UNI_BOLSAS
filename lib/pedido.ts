import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { formatPriceBRL } from '@/lib/format';
import { SITE_URL } from '@/lib/seo';
import { waLink } from '@/lib/whatsapp';

/**
 * O pedido de atacado que a lojista monta no site.
 *
 * Antes cada peça abria uma conversa separada no WhatsApp: quem comprava dez
 * modelos mandava dez mensagens soltas, e a loja montava o pedido na mão,
 * perguntando cor por cor. Agora a lista é montada aqui e vai numa mensagem só.
 *
 * Mora no `localStorage` do aparelho, de propósito: não há conta, cadastro nem
 * tabela nova no banco — o pedido de verdade continua sendo fechado na
 * conversa. O que fica guardado é só o rascunho de quem está escolhendo.
 */

export type PedidoItem = {
  /** produto + cor + tamanho: a mesma peça em outra cor é outra linha. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string | null;
  size: string | null;
  qty: number;
  /** Preço que a pessoa viu ao adicionar — o atendimento confirma. */
  unitPrice: number;
  image: string | null;
};

export type PedidoContato = { nome: string; local: string };

const ITEMS_KEY = 'uni-pedido-v1';
const CONTATO_KEY = 'uni-pedido-contato-v1';
/** Avisa os componentes da mesma aba; outras abas recebem o `storage`. */
export const PEDIDO_EVENT = 'uni-pedido';
/** Pede pra gaveta do pedido abrir. */
export const PEDIDO_ABRIR_EVENT = 'uni-pedido-abrir';
/** Uma peça acabou de entrar — mostra a confirmação. */
export const PEDIDO_ADICIONADO_EVENT = 'uni-pedido-adicionado';

/** Teto por linha: protege a mensagem de um dedo apoiado no "+". */
export const QTD_MAXIMA = 999;

const VAZIO: PedidoItem[] = [];
const CONTATO_VAZIO: PedidoContato = { nome: '', local: '' };

export function itemKey(productId: string, colorName: string | null, size: string | null): string {
  return `${productId}|${colorName ?? ''}|${size ?? ''}`;
}

/** O código de 8 caracteres do link curto `/p/<código>`. */
export function codigoPeca(productId: string): string {
  return productId.replace(/-/g, '').slice(0, 8);
}

export function linkCurto(productId: string): string {
  return `${SITE_URL}/p/${codigoPeca(productId)}`;
}

// --- leitura -----------------------------------------------------------------
// `useSyncExternalStore` exige que a mesma leitura devolva o MESMO objeto
// enquanto nada mudou; por isso o resultado fica guardado junto do texto cru.

let cacheRaw: string | null = null;
let cacheItems: PedidoItem[] = VAZIO;

function isItem(x: unknown): x is PedidoItem {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.key === 'string' &&
    typeof i.productId === 'string' &&
    typeof i.slug === 'string' &&
    typeof i.name === 'string' &&
    typeof i.qty === 'number' &&
    i.qty > 0 &&
    typeof i.unitPrice === 'number'
  );
}

export function readPedido(): PedidoItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ITEMS_KEY);
  } catch {
    // Navegação anônima com armazenamento bloqueado: o pedido vive só na tela.
    return cacheItems;
  }
  if (raw === cacheRaw) return cacheItems;
  cacheRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cacheItems = Array.isArray(parsed) ? parsed.filter(isItem) : VAZIO;
  } catch {
    cacheItems = VAZIO;
  }
  return cacheItems;
}

export function readPedidoServidor(): PedidoItem[] {
  return VAZIO;
}

function writePedido(items: PedidoItem[]): void {
  const raw = JSON.stringify(items);
  try {
    window.localStorage.setItem(ITEMS_KEY, raw);
  } catch {
    // Sem armazenamento, segue em memória pelo resto da visita.
  }
  cacheRaw = raw;
  cacheItems = items;
  window.dispatchEvent(new Event(PEDIDO_EVENT));
}

export function subscribePedido(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ITEMS_KEY) onChange();
  };
  window.addEventListener(PEDIDO_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(PEDIDO_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

// --- escrita -----------------------------------------------------------------

export function adicionarAoPedido(
  item: Omit<PedidoItem, 'key' | 'qty'>,
  qty = 1,
): void {
  const key = itemKey(item.productId, item.colorName, item.size);
  const atual = readPedido();
  const existente = atual.find((i) => i.key === key);
  const novos = existente
    ? atual.map((i) =>
        i.key === key
          ? // Atualiza nome/preço/foto: valem os de agora, não os de quando
            // a peça entrou pela primeira vez.
            { ...i, ...item, key, qty: Math.min(QTD_MAXIMA, i.qty + qty) }
          : i,
      )
    : [...atual, { ...item, key, qty: Math.min(QTD_MAXIMA, qty) }];
  writePedido(novos);
  window.dispatchEvent(
    new CustomEvent(PEDIDO_ADICIONADO_EVENT, { detail: { name: item.name, qty } }),
  );
}

export function mudarQuantidade(key: string, qty: number): void {
  const n = Math.floor(qty);
  const atual = readPedido();
  writePedido(
    n <= 0
      ? atual.filter((i) => i.key !== key)
      : atual.map((i) => (i.key === key ? { ...i, qty: Math.min(QTD_MAXIMA, n) } : i)),
  );
}

export function removerDoPedido(key: string): void {
  writePedido(readPedido().filter((i) => i.key !== key));
}

export function limparPedido(): void {
  writePedido(VAZIO);
}

export function abrirPedido(): void {
  window.dispatchEvent(new Event(PEDIDO_ABRIR_EVENT));
}

// --- contato (opcional) ------------------------------------------------------

export function readContato(): PedidoContato {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CONTATO_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const c = parsed as Record<string, unknown>;
      return {
        nome: typeof c.nome === 'string' ? c.nome : '',
        local: typeof c.local === 'string' ? c.local : '',
      };
    }
  } catch {
    /* sem armazenamento ou valor estragado: começa vazio */
  }
  return CONTATO_VAZIO;
}

export function writeContato(contato: PedidoContato): void {
  try {
    window.localStorage.setItem(CONTATO_KEY, JSON.stringify(contato));
  } catch {
    /* sem armazenamento: o campo só não é lembrado na próxima visita */
  }
}

// --- contas e mensagem -------------------------------------------------------

export function resumoPedido(items: PedidoItem[]) {
  const pecas = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
  return {
    pecas,
    modelos: items.length,
    total,
    faltam: Math.max(0, PEDIDO_MINIMO - pecas),
  };
}

/** Rótulo da variação: "Preto, tam. M". Vazio quando não há nenhuma. */
export function variacao(item: Pick<PedidoItem, 'colorName' | 'size'>): string {
  return [item.colorName, item.size ? `tam. ${item.size}` : null]
    .filter(Boolean)
    .join(', ');
}

/**
 * A mensagem que chega no WhatsApp da loja.
 *
 * Uma linha por peça, com quantidade, preço e o link curto logo abaixo: quem
 * atende confere a peça certa sem adivinhar pelo nome. O total vai marcado
 * como "preços do site" porque frete e disponibilidade ainda são combinados.
 */
export function mensagemPedido(items: PedidoItem[], contato: PedidoContato): string {
  const { pecas, total } = resumoPedido(items);
  const linhas = items.map((item, idx) => {
    const v = variacao(item);
    return (
      `${idx + 1}. *${item.name}*${v ? ` — ${v}` : ''}\n` +
      `${item.qty} un. × ${formatPriceBRL(item.unitPrice)}\n` +
      linkCurto(item.productId)
    );
  });
  const extras = [
    contato.nome.trim() ? `Nome/loja: ${contato.nome.trim()}` : null,
    contato.local.trim() ? `CEP ou cidade: ${contato.local.trim()}` : null,
  ].filter(Boolean);
  return [
    'Olá! Quero fazer um pedido no atacado:',
    linhas.join('\n\n'),
    `Total: ${pecas} ${pecas === 1 ? 'peça' : 'peças'} · ${formatPriceBRL(total)} (preços do site)`,
    ...(extras.length ? [extras.join('\n')] : []),
    'Pode confirmar a disponibilidade e o frete?',
  ].join('\n\n');
}

export function linkPedidoWhatsApp(items: PedidoItem[], contato: PedidoContato): string {
  return waLink(mensagemPedido(items, contato));
}
