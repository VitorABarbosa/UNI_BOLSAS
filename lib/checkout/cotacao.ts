import 'server-only';
import { listProductsForCheckout } from '@/lib/queries/products';
import { productPrice } from '@/lib/product-price';
import { itemKey } from '@/lib/pedido';
import type { Cotacao, ItemEnviado, LinhaCotada } from '@/lib/checkout/tipos';

const centavos = (n: number) => Math.round(n * 100);

/**
 * Recalcula o pedido a partir do banco. É ESTA conta que vai pro Mercado
 * Pago, nunca o preço que o navegador guardou: quem editasse o
 * `localStorage` pagaria o preço que quisesse.
 *
 * Linhas repetidas (mesma peça, cor e tamanho) são somadas. Peça desativada,
 * cor que não existe mais ou tamanho fora da lista saem do pedido e voltam
 * em `removidas`, pra tela avisar a cliente.
 */
export async function cotarPedido(itens: ItemEnviado[]): Promise<Cotacao> {
  const ids = [...new Set(itens.map((i) => i.productId))];
  const produtos = new Map((await listProductsForCheckout(ids)).map((p) => [p.id, p]));

  const linhas = new Map<string, LinhaCotada>();
  const removidas: string[] = [];

  for (const item of itens) {
    const p = produtos.get(item.productId);
    if (!p) {
      removidas.push('Uma peça do pedido não está mais disponível');
      continue;
    }
    const cores = p.colors.map((c) => c.name);
    const cor = item.colorName && cores.includes(item.colorName) ? item.colorName : null;
    if (cores.length > 0 && !cor) {
      removidas.push(`${p.name}${item.colorName ? ` · ${item.colorName}` : ''} (cor indisponível)`);
      continue;
    }
    const tamanhos = p.sizes ?? [];
    const tamanho = item.size && tamanhos.includes(item.size) ? item.size : null;
    if (tamanhos.length > 0 && !tamanho) {
      removidas.push(`${p.name} (escolha o tamanho de novo)`);
      continue;
    }
    const unitPrice = productPrice(p).current;
    if (!(unitPrice > 0)) {
      removidas.push(`${p.name} (sem preço)`);
      continue;
    }
    const key = itemKey(p.id, cor, tamanho);
    const atual = linhas.get(key);
    const qty = Math.min(999, (atual?.qty ?? 0) + item.qty);
    linhas.set(key, {
      key,
      productId: p.id,
      nome: p.name,
      cor,
      tamanho,
      qty,
      unitPrice,
      subtotal: centavos(unitPrice) * qty / 100,
    });
  }

  const lista = [...linhas.values()];
  return {
    linhas: lista,
    removidas,
    pecas: lista.reduce((s, l) => s + l.qty, 0),
    total: lista.reduce((s, l) => s + centavos(l.unitPrice) * l.qty, 0) / 100,
  };
}
