import 'server-only';
import { STORE } from '@/lib/content/store';
import { WHATSAPP_NUMBER } from '@/lib/tokens';
import { soDigitos } from '@/lib/contas/regras';
import { base, cabecalhosME } from '@/lib/frete/melhorenvio';
import { embalar, fisicoDaPeca, type Volume } from '@/lib/frete/caixas';
import { pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import { ErroAutomacao } from '@/lib/automacao/bling';

/**
 * Etiqueta automática no Melhor Envio, depois da nota fiscal autorizada.
 *
 *   carrinho (um item por caixa, com a chave da NF-e) → compra com o saldo
 *   da Carteira do Melhor Envio → gerar etiqueta → link do PDF.
 *
 * O token precisa das permissões: cart-read, cart-write, shipping-calculate,
 * shipping-checkout, shipping-generate, shipping-print, shipping-tracking,
 * orders-read.
 *
 * O pedido do site vai como "tag" de cada envio: dá pra achar no painel do
 * Melhor Envio e evita comprar duas vezes.
 */

async function me<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${base()}${caminho}`, { ...init, headers: cabecalhosME(), cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  const texto = await r.text();
  if (!r.ok) throw new ErroAutomacao(`Melhor Envio ${r.status} em ${caminho}: ${mensagemME(texto)}`);
  return (texto ? JSON.parse(texto) : {}) as T;
}

function mensagemME(texto: string): string {
  try {
    const j = JSON.parse(texto) as { message?: string; error?: string; errors?: Record<string, string[]> };
    const detalhes = j.errors ? Object.values(j.errors).flat().join(' · ') : '';
    return [j.message || j.error, detalhes].filter(Boolean).join(' — ').slice(0, 400) || texto.slice(0, 200);
  } catch {
    return texto.slice(0, 200);
  }
}

export type EtiquetaGerada = { envios: string[]; servico: string };

/** Remetente: a loja, saindo do ponto de coleta. */
function remetente() {
  const c = STORE.coleta;
  const email = (process.env.PEDIDOS_EMAIL ?? '').split(',')[0]?.trim() || 'contato@unibolsas.store';
  return {
    name: STORE.razaoSocial,
    phone: WHATSAPP_NUMBER.replace(/^55/, ''),
    email,
    company_document: soDigitos(STORE.cnpj),
    ...(STORE.inscricaoEstadual ? { state_register: soDigitos(STORE.inscricaoEstadual) } : {}),
    address: c.logradouro,
    number: c.numero,
    complement: c.complemento,
    district: c.bairro,
    city: c.municipio,
    state_abbr: c.uf,
    country_id: 'BR',
    postal_code: soDigitos(c.cep),
  };
}

/** Volumes do pedido, montados pelas peças pagas (mesma conta do checkout). */
function volumesDoPedido(p: Pagamento): Volume[] {
  return embalar(
    pecasDoPagamento(p).map((i) => ({ ...fisicoDaPeca({ categoria: null }), qty: Number(i.quantity) })),
  );
}

/**
 * Compra e gera a etiqueta. `servicoId` é o serviço que a cliente escolheu;
 * `volumes` vem do pedido (as mesmas caixas cotadas no checkout).
 */
export async function gerarEtiqueta(p: Pagamento, chaveNota: string, servicoId: number, volumes?: Volume[]): Promise<EtiquetaGerada> {
  const m = p.metadata ?? {};
  const ref = p.external_reference!;
  const caixas = volumes && volumes.length ? volumes : volumesDoPedido(p);
  const valorPecas = pecasDoPagamento(p).reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);

  // Já comprado antes (repetição do aviso, "tentar de novo")? Reaproveita.
  const anteriores = await me<{ data?: { id: string; status: string; tags?: { tag: string }[] }[] }>(
    `/api/v2/me/orders?q=${encodeURIComponent(ref)}`,
  ).catch(() => ({ data: [] }));
  let ids = (anteriores.data ?? [])
    .filter((o) => o.tags?.some((t) => t.tag === ref) && o.status !== 'canceled')
    .map((o) => o.id);

  if (ids.length === 0) {
    const destinatario = {
      name: m.empresa,
      phone: soDigitos(m.telefone ?? ''),
      email: m.cliente_email,
      company_document: soDigitos(m.cnpj ?? ''),
      address: m.ent_rua,
      number: m.ent_numero,
      complement: m.ent_complemento ?? '',
      district: m.ent_bairro,
      city: m.ent_cidade,
      state_abbr: m.ent_uf,
      country_id: 'BR',
      postal_code: soDigitos(m.ent_cep ?? ''),
    };
    if (!destinatario.address || !destinatario.postal_code) throw new ErroAutomacao('Pedido sem endereço de entrega completo.');
    for (const v of caixas) {
      const item = await me<{ id: string }>('/api/v2/me/cart', {
        method: 'POST',
        body: JSON.stringify({
          service: servicoId,
          from: remetente(),
          to: destinatario,
          volumes: [{ height: v.altura, width: v.largura, length: v.comprimento, weight: v.peso }],
          options: {
            // Seguro dividido entre as caixas, proporcional ao peso.
            insurance_value: Math.round(((valorPecas * v.peso) / caixas.reduce((s, x) => s + x.peso, 0)) * 100) / 100,
            receipt: false,
            own_hand: false,
            reverse: false,
            non_commercial: false,
            invoice: { key: chaveNota },
            platform: 'Uni Bolsas',
            tags: [{ tag: ref, url: null }],
          },
        }),
      });
      ids.push(item.id);
    }
  }

  const status = await me<Record<string, { status: string }>>(`/api/v2/me/shipment/tracking`, {
    method: 'POST',
    body: JSON.stringify({ orders: ids }),
  }).catch(() => ({}) as Record<string, { status: string }>);
  const aComprar = ids.filter((id) => !['released', 'posted', 'delivered', 'paid'].includes(status[id]?.status ?? ''));
  if (aComprar.length > 0) {
    await me('/api/v2/me/shipment/checkout', { method: 'POST', body: JSON.stringify({ orders: aComprar }) }).catch((e: Error) => {
      throw new ErroAutomacao(
        /saldo|balance|insufficient/i.test(e.message)
          ? 'Saldo insuficiente na Carteira do Melhor Envio. Coloque saldo e clique em "Tentar de novo".'
          : e.message,
      );
    });
  }
  const aGerar = ids.filter((id) => !['released', 'posted', 'delivered'].includes(status[id]?.status ?? ''));
  if (aGerar.length > 0) {
    await me('/api/v2/me/shipment/generate', { method: 'POST', body: JSON.stringify({ orders: aGerar }) });
  }
  ids = [...new Set(ids)];
  return { envios: ids, servico: m.frete ?? '' };
}

/** Link (temporário) do PDF das etiquetas pra imprimir. */
export async function linkDeImpressao(envios: string[]): Promise<string> {
  const r = await me<{ url: string }>('/api/v2/me/shipment/print', {
    method: 'POST',
    body: JSON.stringify({ mode: 'private', orders: envios }),
  });
  return r.url;
}

/** Códigos de rastreio, quando a transportadora já liberou. */
export async function rastreios(envios: string[]): Promise<string[]> {
  const r = await me<Record<string, { tracking?: string | null; melhorenvio_tracking?: string | null }>>(
    '/api/v2/me/shipment/tracking',
    { method: 'POST', body: JSON.stringify({ orders: envios }) },
  );
  return envios.map((id) => r[id]?.tracking || r[id]?.melhorenvio_tracking || '').filter(Boolean);
}
