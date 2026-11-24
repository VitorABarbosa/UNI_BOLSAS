import { z } from 'zod';
import { soDigitos } from '@/lib/contas/regras';

/**
 * Tipos e regras do checkout que valem nos dois lados (navegador e servidor).
 * O servidor é quem decide: tudo que chega do navegador é revalidado.
 */

/** O que o navegador manda: só identificação e quantidade, nunca preço. */
export const itemEnviadoSchema = z.object({
  productId: z.string().uuid(),
  colorName: z.string().max(80).nullable(),
  size: z.string().max(20).nullable(),
  qty: z.number().int().min(1).max(999),
});
export const itensEnviadosSchema = z.array(itemEnviadoSchema).min(1).max(100);
export type ItemEnviado = z.infer<typeof itemEnviadoSchema>;

export type LinhaCotada = {
  key: string;
  productId: string;
  nome: string;
  cor: string | null;
  tamanho: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type Cotacao = {
  linhas: LinhaCotada[];
  /** Peças que saíram do pedido (esgotadas, cor ou tamanho que não existe mais). */
  removidas: string[];
  pecas: number;
  total: number;
};

export type EntregaTipo = 'retirada' | 'combinar';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] as const;

const txt = (max: number, msg: string) => z.string().trim().min(1, msg).max(max, 'Texto longo demais');

export const enderecoSchema = z.object({
  cep: z
    .string()
    .trim()
    .refine((v) => soDigitos(v).length === 8, 'CEP com 8 números')
    .transform((v) => soDigitos(v).replace(/^(\d{5})(\d{3})$/, '$1-$2')),
  rua: txt(120, 'Rua'),
  numero: txt(20, 'Número'),
  complemento: z.string().trim().max(60, 'Texto longo demais').optional().default(''),
  bairro: txt(80, 'Bairro'),
  cidade: txt(80, 'Cidade'),
  uf: z.enum(UFS, { message: 'UF' }),
});
export type Endereco = z.output<typeof enderecoSchema>;

export function enderecoEmLinha(e: Endereco): string {
  return `${e.rua}, ${e.numero}${e.complemento ? ` (${e.complemento})` : ''} · ${e.bairro} · ${e.cidade}/${e.uf} · CEP ${e.cep}`;
}

/** Código do pedido, o mesmo que vai pro Mercado Pago como referência. */
export const REF_PEDIDO = /^UB-[A-Z0-9]{6,16}$/;
