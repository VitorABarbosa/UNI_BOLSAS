import 'server-only';
import { STORE } from '@/lib/content/store';
import { soDigitos } from '@/lib/contas/regras';
import type { Volume } from '@/lib/frete/caixas';

/**
 * Cotação de frete no Melhor Envio (Correios, Jadlog e outras).
 *
 * Token: melhorenvio.com.br → Configurações → Permissões de acesso → gerar
 * token com "shipping-calculate". Vai em `MELHORENVIO_TOKEN`, só no servidor.
 * `MELHORENVIO_AMBIENTE=sandbox` usa o ambiente de testes deles.
 */

function base(): string {
  if (process.env.MELHORENVIO_API_URL) return process.env.MELHORENVIO_API_URL.replace(/\/+$/, '');
  return process.env.MELHORENVIO_AMBIENTE === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
}

export function melhorEnvioConfigurado(): boolean {
  return !!process.env.MELHORENVIO_TOKEN;
}

export type OpcaoFrete = {
  id: number;
  nome: string;
  transportadora: string;
  preco: number;
  /** dias úteis, já com o dia de separação somado */
  prazoMin: number;
  prazoMax: number;
};

type RespostaServico = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  delivery_range?: { min: number; max: number };
  custom_delivery_range?: { min: number; max: number };
  company?: { name: string };
  error?: string;
};

/** Dia útil que a loja leva pra separar antes de postar. */
const DIAS_SEPARACAO = 1;

/**
 * Cota o envio de `volumes` (as caixas já montadas) da origem da loja até o
 * CEP. Devolve as opções sem erro, da mais barata pra mais cara.
 */
export async function cotarFrete(p: { cepDestino: string; volumes: Volume[]; valorDeclarado: number }): Promise<OpcaoFrete[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new Error('MELHORENVIO_TOKEN não configurado');
  const corpo = {
    from: { postal_code: soDigitos(STORE.coleta.cep) },
    to: { postal_code: soDigitos(p.cepDestino) },
    volumes: p.volumes.map((v) => ({ height: v.altura, width: v.largura, length: v.comprimento, weight: v.peso })),
    options: {
      // Seguro pelo valor das peças: sem ele, extravio não é ressarcido.
      insurance_value: Math.round(p.valorDeclarado * 100) / 100,
      receipt: false,
      own_hand: false,
    },
  };
  const r = await fetch(`${base()}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // O Melhor Envio pede nome da aplicação e um contato técnico.
      'User-Agent': `Uni Bolsas (${process.env.MELHORENVIO_CONTATO || 'contato@unibolsas.store'})`,
    },
    body: JSON.stringify(corpo),
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });
  if (!r.ok) throw new Error(`Melhor Envio respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const lista = (await r.json()) as RespostaServico[];
  return (Array.isArray(lista) ? lista : [])
    .filter((s) => !s.error && Number(s.custom_price ?? s.price) > 0)
    .map((s) => {
      const faixa = s.custom_delivery_range ?? s.delivery_range;
      const dias = s.custom_delivery_time ?? s.delivery_time ?? faixa?.max ?? 0;
      return {
        id: s.id,
        nome: s.name,
        transportadora: s.company?.name ?? '',
        preco: Math.round(Number(s.custom_price ?? s.price) * 100) / 100,
        prazoMin: (faixa?.min ?? dias) + DIAS_SEPARACAO,
        prazoMax: (faixa?.max ?? dias) + DIAS_SEPARACAO,
      };
    })
    .sort((a, b) => a.preco - b.preco);
}

export function prazoEmTexto(o: Pick<OpcaoFrete, 'prazoMin' | 'prazoMax'>): string {
  return o.prazoMin === o.prazoMax ? `${o.prazoMax} dias úteis` : `${o.prazoMin} a ${o.prazoMax} dias úteis`;
}
