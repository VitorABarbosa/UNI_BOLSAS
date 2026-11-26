import { z } from 'zod';

/**
 * Regras dos formulários de conta da cliente.
 *
 * Este arquivo roda dos DOIS lados: no navegador, pra avisar na hora, e no
 * servidor, que é quem decide. A checagem do navegador é só conforto; quem
 * chama a ação direto, sem passar pelo formulário, cai na mesma regra.
 */

/** Só os dígitos. */
export function soDigitos(v: string): string {
  return v.replace(/\D+/g, '');
}

/**
 * CNPJ válido pelos dígitos verificadores.
 *
 * Não confirma que a empresa existe, só que o número foi digitado certo.
 * Pega o erro mais comum, que é um dígito trocado.
 */
export function cnpjValido(v: string): boolean {
  const d = soDigitos(v);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const n of base) {
      soma += Number(n) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(d.slice(0, 12));
  const d2 = calc(d.slice(0, 12) + d1);
  return d.endsWith(`${d1}${d2}`);
}

export function formatarCnpj(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatarTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Senhas que aparecem no topo de toda lista de vazamento. */
const SENHAS_OBVIAS = new Set([
  '12345678', '123456789', '1234567890', 'senha123', 'senha1234', 'password',
  'password1', 'qwerty123', 'abc12345', '11111111', '00000000', 'unibolsas',
  'unibolsas1', 'unibolsas123', 'bolsas123', 'mudar123', 'admin123',
]);

export const SENHA_MIN = 8;
/** O Supabase guarda a senha com bcrypt, que ignora o que passa de 72 bytes. */
export const SENHA_MAX = 72;

export const senhaSchema = z
  .string()
  .min(SENHA_MIN, `Use pelo menos ${SENHA_MIN} caracteres`)
  .refine((s) => new TextEncoder().encode(s).length <= SENHA_MAX, 'Senha longa demais')
  .refine((s) => /[a-zA-Z]/.test(s) && /\d/.test(s), 'Misture letras e números')
  .refine((s) => !SENHAS_OBVIAS.has(s.toLowerCase()), 'Essa senha é fácil de adivinhar');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'E-mail longo demais')
  .email('E-mail inválido');

const texto = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, msg).max(max, 'Texto longo demais');

export const perfilSchema = z.object({
  nome: texto(2, 80, 'Diga seu nome'),
  empresa: texto(2, 120, 'Nome da loja ou razão social'),
  cnpj: z
    .string()
    .trim()
    .refine(cnpjValido, 'CNPJ inválido, confira os números')
    .transform(formatarCnpj),
  telefone: z
    .string()
    .trim()
    .refine((v) => [10, 11].includes(soDigitos(v).length), 'Telefone com DDD')
    .transform(formatarTelefone),
});
export type Perfil = z.output<typeof perfilSchema> & Partial<Omit<EnderecoLoja, 'uf'> & { uf: string; ie: string }>;

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] as const;
const parte = (max: number, msg: string) => z.string().trim().min(1, msg).max(max, 'Texto longo demais');

/**
 * Endereço da loja da cliente. A nota fiscal exige o endereço do comprador,
 * mesmo quando a cliente retira na loja; no envio, ele vem preenchido como
 * endereço de entrega.
 */
export const enderecoLojaSchema = z.object({
  cep: z
    .string()
    .trim()
    .refine((v) => soDigitos(v).length === 8, 'CEP com 8 números')
    .transform((v) => soDigitos(v).replace(/^(\d{5})(\d{3})$/, '$1-$2')),
  rua: parte(120, 'Rua'),
  numero: parte(20, 'Número'),
  complemento: z.string().trim().max(60, 'Texto longo demais').optional().default(''),
  bairro: parte(80, 'Bairro'),
  cidade: parte(80, 'Cidade'),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(UFS, { message: 'UF' })),
});
export type EnderecoLoja = z.output<typeof enderecoLojaSchema>;

/**
 * Inscrição Estadual da loja da cliente (opcional). Vai na nota fiscal: com
 * ela, a nota sai como venda para revenda (contribuinte do ICMS). Aceita só
 * números ou "ISENTO".
 */
export const ieSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => (/^ISENT/.test(v) ? 'ISENTO' : soDigitos(v)))
  .refine((v) => v === '' || v === 'ISENTO' || (v.length >= 8 && v.length <= 14), 'Inscrição Estadual: só números (ou ISENTO)')
  .optional()
  .default('');

/** Perfil completo, com o endereço: é o que o checkout salva. */
export const perfilComEnderecoSchema = perfilSchema.extend(enderecoLojaSchema.shape).extend({ ie: ieSchema });

/** Os dados da loja estão completos pra emitir nota? */
export function perfilCompleto(p: Partial<Perfil>): boolean {
  return !!(p.nome && p.empresa && p.cnpj && p.telefone && p.cep && p.rua && p.numero && p.bairro && p.cidade && p.uf);
}

export const cadastroSchema = perfilSchema.extend({
  email,
  senha: senhaSchema,
  aceite: z.literal(true, { message: 'Precisa aceitar para criar a conta' }),
  /** Armadilha pra robô: campo escondido que gente de verdade não preenche. */
  site: z.string().max(0).optional(),
});

export const entrarSchema = z.object({
  email,
  senha: z.string().min(1, 'Digite a senha').max(200),
});

export const esqueciSchema = z.object({ email });

export const novaSenhaSchema = z
  .object({ senha: senhaSchema, confirmar: z.string() })
  .refine((v) => v.senha === v.confirmar, {
    message: 'As senhas não são iguais',
    path: ['confirmar'],
  });

export const trocarSenhaSchema = z
  .object({ atual: z.string().min(1, 'Digite a senha atual').max(200), senha: senhaSchema, confirmar: z.string() })
  .refine((v) => v.senha === v.confirmar, {
    message: 'As senhas não são iguais',
    path: ['confirmar'],
  })
  .refine((v) => v.senha !== v.atual, {
    message: 'A nova senha precisa ser diferente da atual',
    path: ['senha'],
  });

/**
 * Pra onde mandar depois de entrar. Só caminhos do próprio site: um `next`
 * apontando pra fora transformaria o login num trampolim pra golpe.
 */
export function destinoSeguro(next: unknown, padrao = '/conta'): string {
  if (typeof next !== 'string') return padrao;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return padrao;
  if (next.startsWith('/admin')) return padrao;
  return next;
}
