import 'server-only';
import { SITE_URL } from '@/lib/seo';

/**
 * E-mails das contas, mandados pelo Resend (resend.com).
 *
 * Por que não o e-mail do próprio Supabase: o de fábrica só entrega pra
 * equipe do projeto e manda uns poucos por hora — cliente de verdade não
 * receberia o link. Aqui o Supabase só GERA o link (sem mandar nada) e quem
 * entrega é o Resend, com o remetente do domínio da loja.
 *
 * Sem `RESEND_API_KEY`:
 *  - em desenvolvimento, o e-mail é escrito no terminal (pra testar);
 *  - fora dele, o envio falha e quem chamou mostra o erro. Nunca finge que
 *    mandou.
 */

const REMETENTE = process.env.EMAIL_REMETENTE || 'Uni Bolsas <contato@unibolsas.store>';

export type Email = {
  para: string | string[];
  assunto: string;
  titulo: string;
  paragrafos: string[];
  botao?: { texto: string; url: string };
  rodape?: string;
  /** Pra onde vai a resposta (ex.: o aviso de venda responde direto pra cliente). */
  responderPara?: string;
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function html(e: Email): string {
  const botao = e.botao
    ? `<p style="margin:28px 0"><a href="${esc(e.botao.url)}" style="display:inline-block;background:#111111;color:#F4EFE6;text-decoration:none;padding:15px 26px;font:500 13px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase">${esc(e.botao.texto)}</a></p>
       <p style="font:13px/1.5 Arial,sans-serif;color:#6E665C;margin:0 0 18px">Se o botão não abrir, copie este endereço no navegador:<br><span style="word-break:break-all;color:#2A2724">${esc(e.botao.url)}</span></p>`
    : '';
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4EFE6;padding:28px 12px">
<div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E5DECF;padding:32px 28px">
<p style="font:italic 22px Georgia,serif;margin:0 0 26px;color:#111111">Uni Bolsas</p>
<h1 style="font:400 26px/1.2 Georgia,serif;margin:0 0 16px;color:#111111">${esc(e.titulo)}</h1>
${e.paragrafos.map((p) => `<p style="font:15px/1.6 Arial,sans-serif;color:#2A2724;margin:0 0 12px">${esc(p)}</p>`).join('')}
${botao}
<p style="font:12px/1.5 Arial,sans-serif;color:#6E665C;margin:26px 0 0;border-top:1px solid #E5DECF;padding-top:16px">${esc(e.rodape ?? 'Se não foi você, pode ignorar este e-mail: nada muda na sua conta.')}<br>Uni Bolsas · atacado de bolsas no Brás · ${esc(SITE_URL.replace(/^https?:\/\//, ''))}</p>
</div></body></html>`;
}

function texto(e: Email): string {
  return [e.titulo, '', ...e.paragrafos, ...(e.botao ? ['', `${e.botao.texto}: ${e.botao.url}`] : []), '', e.rodape ?? 'Se não foi você, ignore este e-mail.'].join('\n');
}

export async function enviarEmail(e: Email): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    if (process.env.NODE_ENV === 'development' || process.env.CONTAS_EMAIL_NO_TERMINAL === '1') {
      console.log(`[email] para=${e.para} assunto="${e.assunto}"${e.botao ? ` link=${e.botao.url}` : ''}`);
      return true;
    }
    console.error('[email] RESEND_API_KEY não configurada; e-mail não enviado.');
    return false;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMETENTE,
        to: Array.isArray(e.para) ? e.para : [e.para],
        subject: e.assunto,
        html: html(e),
        text: texto(e),
        ...(e.responderPara ? { reply_to: e.responderPara } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      // O corpo da resposta não leva dado da cliente; ajuda a achar o erro de configuração.
      console.error(`[email] Resend recusou (${r.status}): ${(await r.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] falha ao falar com o Resend:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** Link de uso único que volta pro site. `tipo` diz o que o link confirma. */
export function linkDeConfirmacao(tipo: 'cadastro' | 'senha', tokenHash: string): string {
  const u = new URL('/conta/confirmar', SITE_URL);
  u.searchParams.set('tipo', tipo);
  u.searchParams.set('t', tokenHash);
  return u.toString();
}

export const emails = {
  confirmarCadastro: (para: string, nome: string, url: string): Email => ({
    para,
    assunto: 'Confirme seu e-mail · Uni Bolsas',
    titulo: `Olá, ${nome.split(' ')[0]}!`,
    paragrafos: ['Falta só um passo para ativar sua conta de atacado na Uni Bolsas.', 'O link só funciona uma vez.'],
    botao: { texto: 'Confirmar meu e-mail', url },
    rodape: 'Se você não criou conta na Uni Bolsas, ignore este e-mail: sem a confirmação, a conta não é ativada.',
  }),
  contaJaExiste: (para: string): Email => ({
    para,
    assunto: 'Você já tem conta na Uni Bolsas',
    titulo: 'Você já tem uma conta',
    paragrafos: ['Alguém tentou criar uma conta com este e-mail, mas ele já está cadastrado.', 'Se foi você e esqueceu a senha, crie uma nova pelo botão abaixo.'],
    botao: { texto: 'Criar nova senha', url: new URL('/conta/esqueci-senha', SITE_URL).toString() },
  }),
  redefinirSenha: (para: string, url: string): Email => ({
    para,
    assunto: 'Criar nova senha · Uni Bolsas',
    titulo: 'Criar uma nova senha',
    paragrafos: ['Recebemos um pedido para trocar a senha da sua conta.', 'O link só funciona uma vez, e um pedido novo cancela o anterior.'],
    botao: { texto: 'Criar nova senha', url },
    rodape: 'Se você não pediu, ignore este e-mail: sua senha continua a mesma.',
  }),
  senhaAlterada: (para: string): Email => ({
    para,
    assunto: 'Sua senha foi alterada · Uni Bolsas',
    titulo: 'Sua senha foi alterada',
    paragrafos: ['A senha da sua conta na Uni Bolsas acabou de ser trocada, e as outras sessões abertas foram encerradas.'],
    botao: { texto: 'Não fui eu: recuperar a conta', url: new URL('/conta/esqueci-senha', SITE_URL).toString() },
    rodape: 'Se foi você, não precisa fazer nada.',
  }),
};
