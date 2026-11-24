/**
 * Como os pedidos são embalados, para calcular o frete.
 *
 * Bolsa é leve e ocupa espaço: no frete, quase sempre manda o "peso cubado"
 * (C × L × A ÷ 6000), não o peso da balança. Caixa grande demais = frete
 * caro à toa. Por isso há três tamanhos, e o pedido vai no menor que serve.
 *
 * AJUSTE AQUI: medidas das caixas que a loja usa e as médias por categoria.
 */

export type Caixa = { nome: string; altura: number; largura: number; comprimento: number; /** peso da caixa vazia */ tara: number };

export const CAIXAS: Caixa[] = [
  { nome: 'P', altura: 25, largura: 30, comprimento: 40, tara: 0.3 },
  { nome: 'M', altura: 30, largura: 40, comprimento: 50, tara: 0.5 },
  { nome: 'G', altura: 40, largura: 50, comprimento: 60, tara: 0.8 },
];

/** Quanto da caixa dá pra ocupar de verdade (bolsa não encaixa sem folga). */
const APROVEITAMENTO = 0.85;

/** Médias por categoria, para produto sem peso/medidas no cadastro. */
const MEDIAS: Record<string, { litros: number; kg: number }> = {
  bolsas: { litros: 4, kg: 0.5 },
  mochilas: { litros: 7, kg: 0.7 },
  esportivas: { litros: 10, kg: 0.8 },
  malas: { litros: 45, kg: 3 },
  kits: { litros: 6, kg: 0.8 },
};
const MEDIA_PADRAO = { litros: 6, kg: 0.6 };

export type Fisico = { litros: number; kg: number };

/** "420 g", "0,5 kg", "1.2kg" → kg. */
export function lerPeso(txt: string | null | undefined): number | null {
  if (!txt) return null;
  const m = txt.replace(',', '.').match(/([\d.]+)\s*(kg|g)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!(n > 0)) return null;
  const kg = m[2]!.toLowerCase() === 'g' ? n / 1000 : n;
  return kg > 0.01 && kg < 40 ? kg : null;
}

/** "28 × 18 × 9 cm", "28x18x9" → litros. Bolsa macia: conta 80% do volume. */
export function lerLitros(txt: string | null | undefined): number | null {
  if (!txt) return null;
  const nums = txt.replace(/,/g, '.').match(/[\d.]+/g)?.map(Number).filter((n) => n > 0);
  if (!nums || nums.length < 3) return null;
  const [a, b, c] = nums as [number, number, number];
  const litros = (a * b * c) / 1000;
  return litros > 0.2 && litros < 200 ? litros * 0.8 : null;
}

export function fisicoDaPeca(p: { categoria?: string | null; peso?: string | null; medidas?: string | null }): Fisico {
  const media = MEDIAS[p.categoria ?? ''] ?? MEDIA_PADRAO;
  return { litros: lerLitros(p.medidas) ?? media.litros, kg: lerPeso(p.peso) ?? media.kg };
}

export type Volume = { caixa: string; altura: number; largura: number; comprimento: number; peso: number };

const capacidade = (c: Caixa) => ((c.altura * c.largura * c.comprimento) / 1000) * APROVEITAMENTO;

/**
 * Distribui as peças em caixas: tudo numa caixa só, a menor que couber; se
 * não couber nem na maior, enche caixas G e o resto vai na menor que servir.
 */
export function embalar(pecas: (Fisico & { qty: number })[]): Volume[] {
  const litros = pecas.reduce((s, p) => s + p.litros * p.qty, 0);
  const kg = pecas.reduce((s, p) => s + p.kg * p.qty, 0);
  if (litros <= 0) return [];
  const maior = CAIXAS[CAIXAS.length - 1]!;
  const volumes: Volume[] = [];
  let restoL = litros;
  // Peso dividido na proporção do volume de cada caixa.
  const pesoPorLitro = kg / litros;
  while (restoL > capacidade(maior)) {
    const l = capacidade(maior);
    volumes.push(volume(maior, l * pesoPorLitro));
    restoL -= l;
  }
  const caixa = CAIXAS.find((c) => capacidade(c) >= restoL) ?? maior;
  volumes.push(volume(caixa, restoL * pesoPorLitro));
  return volumes;
}

function volume(c: Caixa, kgPecas: number): Volume {
  return {
    caixa: c.nome,
    altura: c.altura,
    largura: c.largura,
    comprimento: c.comprimento,
    peso: Math.round((kgPecas + c.tara) * 100) / 100,
  };
}

/** "1 caixa P", "2 caixas G + 1 caixa M" — pra quem vai embalar. */
export function resumoCaixas(v: Volume[]): string {
  const cont = new Map<string, number>();
  for (const x of v) cont.set(x.caixa, (cont.get(x.caixa) ?? 0) + 1);
  return [...cont].map(([c, n]) => `${n} ${n === 1 ? 'caixa' : 'caixas'} ${c}`).join(' + ');
}
