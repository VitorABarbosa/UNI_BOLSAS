import 'server-only';
import { headers } from 'next/headers';

/**
 * Freio contra tentativa em massa: chute de senha, cadastro por robô,
 * enxurrada de "esqueci a senha" que gastaria a cota de e-mails.
 *
 * Fica na memória do servidor. O site roda num processo só, então isso
 * basta; se um dia rodar em várias máquinas, cada uma terá o seu freio, o
 * que ainda segura o grosso. O Supabase tem o freio dele por trás deste.
 */
type Janela = { inicio: number; contagem: number };
const janelas = new Map<string, Janela>();

function limpar(agora: number) {
  if (janelas.size < 5000) return;
  for (const [k, j] of janelas) if (agora - j.inicio > 60 * 60 * 1000) janelas.delete(k);
}

/** true = pode seguir; false = passou do limite. */
export function dentroDoLimite(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  limpar(agora);
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, contagem: 1 });
    return true;
  }
  j.contagem += 1;
  return j.contagem <= max;
}

/** Zera a contagem (ex.: depois de um login certo). */
export function zerarLimite(chave: string) {
  janelas.delete(chave);
}

/** O IP de quem chamou, como a hospedagem repassa. */
export async function ipDaRequisicao(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? 'desconhecido';
}

export const MINUTO = 60 * 1000;
