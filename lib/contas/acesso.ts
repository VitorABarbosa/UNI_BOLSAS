import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';

/**
 * A chave que liga as contas de cliente.
 *
 * Com `NEXT_PUBLIC_COMPRA_NO_SITE=desligada`, as páginas de conta e a compra pelo
 * site não existem pra quem visita (404) e as ações recusam qualquer chamada;
 * a única porta é o link de prévia (`/api/conta/previa?chave=…`), que grava
 * um cookie neste navegador. Sem a variável (ou com qualquer outro valor),
 * está ligado pra todo mundo.
 *
 * A variável tem o prefixo NEXT_PUBLIC_ porque o cabeçalho (que roda no
 * navegador) precisa saber se mostra o botão "Entrar". Não é segredo: o
 * segredo é a chave da prévia, que só o servidor conhece.
 */
// Ver lib/contas/ligado.ts (interruptor de emergência).
export const CONTAS_ATIVAS = COMPRA_NO_SITE;

export const COOKIE_PREVIA = 'uni-contas-previa';
/** Cookie visível pro navegador, só pra o cabeçalho mostrar o botão. */
export const COOKIE_PREVIA_VISIVEL = 'uni-contas';

/** O cookie guarda o hash da chave, nunca a chave em si. */
export function hashPrevia(chave: string): string {
  return createHash('sha256').update(`uni-contas:${chave}`).digest('hex');
}

export function chavePreviaConfere(chave: string | null | undefined): boolean {
  const certa = process.env.CONTAS_PREVIA_CHAVE;
  // Sem chave configurada, ou curta demais pra resistir a chute: prévia fechada.
  if (!certa || certa.length < 16 || !chave) return false;
  const a = Buffer.from(hashPrevia(chave));
  const b = Buffer.from(hashPrevia(certa));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function contasLiberadas(): Promise<boolean> {
  if (CONTAS_ATIVAS) return true;
  const certa = process.env.CONTAS_PREVIA_CHAVE;
  if (!certa || certa.length < 16) return false;
  const valor = (await cookies()).get(COOKIE_PREVIA)?.value;
  if (!valor) return false;
  const a = Buffer.from(valor);
  const b = Buffer.from(hashPrevia(certa));
  return a.length === b.length && timingSafeEqual(a, b);
}
