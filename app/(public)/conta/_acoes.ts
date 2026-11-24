'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { contasLiberadas } from '@/lib/contas/acesso';
import { dentroDoLimite, ipDaRequisicao, zerarLimite, MINUTO } from '@/lib/contas/limite';
import { emails, enviarEmail, linkDeConfirmacao } from '@/lib/contas/email';
import { clienteAtual, supabaseSemSessao } from '@/lib/contas/sessao';
import {
  cadastroSchema,
  destinoSeguro,
  entrarSchema,
  esqueciSchema,
  novaSenhaSchema,
  perfilSchema,
  trocarSenhaSchema,
} from '@/lib/contas/regras';

/**
 * Ações das contas de cliente. Tudo que decide alguma coisa acontece aqui,
 * no servidor.
 *
 * Princípios:
 *  - Nenhuma resposta diz se um e-mail tem conta ou não (cadastro e "esqueci
 *    a senha" respondem igual nos dois casos). Isso impede que alguém use o
 *    site pra descobrir quem é cliente.
 *  - Todo formulário tem freio de tentativas por IP e por e-mail.
 *  - Os links dos e-mails são de uso único e são confirmados por um clique
 *    na página (POST), não ao abrir o link: antivírus de e-mail costumam
 *    "abrir" os links sozinhos, e isso queimaria o link antes da cliente.
 */

export type Resultado =
  | { ok: true; mensagem?: string }
  | { ok: false; erro: string; campos?: Record<string, string> };

const FECHADO: Resultado = { ok: false, erro: 'Contas ainda não estão disponíveis.' };
const DEVAGAR: Resultado = { ok: false, erro: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.' };
const SEM_EMAIL: Resultado = { ok: false, erro: 'Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos.' };

/** Cookie curto que libera a tela de nova senha depois do link de recuperação. */
const COOKIE_REDEFINIR = 'uni-redefinir';

function campos(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? 'form');
    out[k] ??= i.message;
  }
  return out;
}

function invalido(issues: { path: PropertyKey[]; message: string }[]): Resultado {
  return { ok: false, erro: 'Confira os campos destacados.', campos: campos(issues) };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

// ─── Cadastro ───────────────────────────────────────────────────────────────

export async function cadastrar(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const p = cadastroSchema.safeParse({
    nome: str(fd, 'nome'),
    empresa: str(fd, 'empresa'),
    cnpj: str(fd, 'cnpj'),
    telefone: str(fd, 'telefone'),
    email: str(fd, 'email'),
    senha: str(fd, 'senha'),
    aceite: fd.get('aceite') === 'on',
    site: str(fd, 'site'),
  });
  // Robô preencheu o campo escondido: finge que deu certo e não faz nada.
  if (str(fd, 'site')) return { ok: true, mensagem: str(fd, 'email') };
  if (!p.success) return invalido(p.error.issues);
  const { email, senha, nome, empresa, cnpj, telefone } = p.data;

  const ip = await ipDaRequisicao();
  if (!dentroDoLimite(`cad:ip:${ip}`, 5, 60 * MINUTO) || !dentroDoLimite(`cad:em:${email}`, 3, 60 * MINUTO)) return DEVAGAR;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: senha,
    options: { data: { nome, empresa, cnpj, telefone } },
  });

  if (error) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      // Mesma resposta de um cadastro novo; quem é dona do e-mail fica sabendo por lá.
      await enviarEmail(emails.contaJaExiste(email));
      return { ok: true, mensagem: email };
    }
    if (error.code === 'weak_password') {
      return { ok: false, erro: 'Escolha uma senha mais forte.', campos: { senha: 'Senha fraca demais: use letras, números e um símbolo' } };
    }
    console.error('[conta] cadastro falhou:', error.code, error.message);
    return { ok: false, erro: 'Não foi possível criar a conta agora. Tente de novo em alguns minutos.' };
  }

  const enviado = await enviarEmail(
    emails.confirmarCadastro(email, nome, linkDeConfirmacao('cadastro', data.properties.hashed_token)),
  );
  if (!enviado) return SEM_EMAIL;
  return { ok: true, mensagem: email };
}

// ─── Entrar ─────────────────────────────────────────────────────────────────

export async function entrar(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const p = entrarSchema.safeParse({ email: str(fd, 'email'), senha: str(fd, 'senha') });
  if (!p.success) return invalido(p.error.issues);
  const { email, senha } = p.data;

  const ip = await ipDaRequisicao();
  if (!dentroDoLimite(`ent:ip:${ip}`, 20, 15 * MINUTO) || !dentroDoLimite(`ent:em:${email}`, 8, 15 * MINUTO)) return DEVAGAR;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  const naoConfirmado = error?.code === 'email_not_confirmed' || (!error && !data.user?.email_confirmed_at);
  if (naoConfirmado) {
    if (!error) await supabase.auth.signOut();
    // A senha estava certa (o Supabase só diz "não confirmado" depois de
    // conferir), então dá pra gerar um link novo e mandar de novo.
    if (dentroDoLimite(`reconf:${email}`, 2, 60 * MINUTO)) {
      const { data: l } = await createAdminClient().auth.admin.generateLink({ type: 'signup', email, password: senha });
      if (l?.properties?.hashed_token) {
        const nome = (l.user?.user_metadata?.nome as string | undefined) ?? '';
        await enviarEmail(emails.confirmarCadastro(email, nome || 'tudo bem', linkDeConfirmacao('cadastro', l.properties.hashed_token)));
      }
    }
    return { ok: false, erro: `Falta confirmar seu e-mail. Mandamos um link para ${email}: abra e depois entre de novo.` };
  }
  if (error || !data.user) {
    return { ok: false, erro: 'E-mail ou senha incorretos.', campos: { senha: 'E-mail ou senha incorretos' } };
  }

  zerarLimite(`ent:em:${email}`);
  redirect(destinoSeguro(str(fd, 'next')));
}

// ─── Esqueci a senha ────────────────────────────────────────────────────────

export async function pedirNovaSenha(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const p = esqueciSchema.safeParse({ email: str(fd, 'email') });
  if (!p.success) return invalido(p.error.issues);
  const { email } = p.data;

  const ip = await ipDaRequisicao();
  if (!dentroDoLimite(`esq:ip:${ip}`, 5, 15 * MINUTO)) return DEVAGAR;
  // Por e-mail, o excesso é ignorado em silêncio: responder diferente
  // revelaria que o e-mail existe.
  if (dentroDoLimite(`esq:em:${email}`, 3, 60 * MINUTO)) {
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: 'recovery', email });
    if (!error && data?.properties?.hashed_token) {
      const ok = await enviarEmail(emails.redefinirSenha(email, linkDeConfirmacao('senha', data.properties.hashed_token)));
      if (!ok) return SEM_EMAIL;
    } else if (error && error.code !== 'user_not_found' && error.status !== 404) {
      console.error('[conta] recuperação falhou:', error.code, error.message);
    }
  }
  return { ok: true, mensagem: email };
}

// ─── Link do e-mail (confirmar cadastro / abrir troca de senha) ─────────────

export async function confirmarLink(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const tipo = str(fd, 'tipo');
  const t = str(fd, 't');
  if ((tipo !== 'cadastro' && tipo !== 'senha') || !/^[a-zA-Z0-9_-]{10,200}$/.test(t)) {
    return { ok: false, erro: 'Este link está incompleto. Abra de novo pelo e-mail.' };
  }
  const ip = await ipDaRequisicao();
  if (!dentroDoLimite(`conf:ip:${ip}`, 15, 15 * MINUTO)) return DEVAGAR;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: t,
    type: tipo === 'senha' ? 'recovery' : 'email',
  });
  if (error || !data.user) {
    return {
      ok: false,
      erro:
        tipo === 'senha'
          ? 'Este link não vale mais (já foi usado, expirou ou um pedido mais novo o substituiu). Peça outro.'
          : 'Este link não vale mais. Se a conta já foi confirmada, é só entrar. Se não, tente entrar que mandamos um novo.',
    };
  }

  if (tipo === 'senha') {
    (await cookies()).set(COOKIE_REDEFINIR, data.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/conta',
      maxAge: 15 * 60,
    });
    redirect('/conta/nova-senha');
  }
  redirect('/conta?bem-vinda=1');
}

// ─── Nova senha (depois do link de recuperação) ─────────────────────────────

export async function definirNovaSenha(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const jar = await cookies();
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user || jar.get(COOKIE_REDEFINIR)?.value !== u.user.id) {
    return { ok: false, erro: 'O tempo para trocar a senha acabou. Peça um novo link.' };
  }
  const p = novaSenhaSchema.safeParse({ senha: str(fd, 'senha'), confirmar: str(fd, 'confirmar') });
  if (!p.success) return invalido(p.error.issues);

  const { error } = await supabase.auth.updateUser({ password: p.data.senha });
  if (error) {
    if (error.code === 'same_password') return { ok: false, erro: 'Use uma senha diferente da anterior.', campos: { senha: 'Igual à anterior' } };
    if (error.code === 'weak_password') return { ok: false, erro: 'Escolha uma senha mais forte.', campos: { senha: 'Senha fraca demais' } };
    console.error('[conta] nova senha falhou:', error.code, error.message);
    return { ok: false, erro: 'Não foi possível trocar a senha agora. Tente de novo.' };
  }
  // Quem tinha a senha antiga (se foi roubada) perde o acesso agora.
  await supabase.auth.signOut({ scope: 'others' });
  jar.delete({ name: COOKIE_REDEFINIR, path: '/conta' });
  if (u.user.email) await enviarEmail(emails.senhaAlterada(u.user.email));
  redirect('/conta?senha=alterada');
}

// ─── Minha conta ────────────────────────────────────────────────────────────

export async function salvarPerfil(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const cliente = await clienteAtual();
  if (!cliente) return { ok: false, erro: 'Sua sessão terminou. Entre de novo.' };
  const p = perfilSchema.safeParse({
    nome: str(fd, 'nome'),
    empresa: str(fd, 'empresa'),
    cnpj: str(fd, 'cnpj'),
    telefone: str(fd, 'telefone'),
  });
  if (!p.success) return invalido(p.error.issues);
  const { error } = await (await createClient()).auth.updateUser({ data: p.data });
  if (error) {
    console.error('[conta] salvar perfil falhou:', error.code, error.message);
    return { ok: false, erro: 'Não foi possível salvar agora. Tente de novo.' };
  }
  revalidatePath('/conta');
  return { ok: true, mensagem: 'Dados salvos.' };
}

export async function trocarSenha(_: Resultado | null, fd: FormData): Promise<Resultado> {
  if (!(await contasLiberadas())) return FECHADO;
  const cliente = await clienteAtual();
  if (!cliente) return { ok: false, erro: 'Sua sessão terminou. Entre de novo.' };
  if (!dentroDoLimite(`troca:${cliente.id}`, 5, 15 * MINUTO)) return DEVAGAR;
  const p = trocarSenhaSchema.safeParse({ atual: str(fd, 'atual'), senha: str(fd, 'senha'), confirmar: str(fd, 'confirmar') });
  if (!p.success) return invalido(p.error.issues);

  // Confere a senha atual numa sessão à parte, que é fechada em seguida.
  const conferir = supabaseSemSessao();
  const { error: errAtual } = await conferir.auth.signInWithPassword({ email: cliente.email, password: p.data.atual });
  if (errAtual) return { ok: false, erro: 'A senha atual não confere.', campos: { atual: 'Senha atual incorreta' } };
  // 'local': encerra só esta sessão de conferência. O padrão ('global')
  // derrubaria também a sessão da própria cliente.
  await conferir.auth.signOut({ scope: 'local' });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: p.data.senha });
  if (error) {
    if (error.code === 'weak_password') return { ok: false, erro: 'Escolha uma senha mais forte.', campos: { senha: 'Senha fraca demais' } };
    console.error('[conta] troca de senha falhou:', error.code, error.message);
    return { ok: false, erro: 'Não foi possível trocar a senha agora. Tente de novo.' };
  }
  await supabase.auth.signOut({ scope: 'others' });
  await enviarEmail(emails.senhaAlterada(cliente.email));
  return { ok: true, mensagem: 'Senha trocada. As outras sessões abertas foram encerradas.' };
}

export async function sair(): Promise<void> {
  await (await createClient()).auth.signOut({ scope: 'local' });
  redirect('/');
}
