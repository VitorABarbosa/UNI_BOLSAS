'use client';

import Link from 'next/link';
import { useActionState, useId, useState, type ReactNode } from 'react';
import {
  cadastrar,
  confirmarLink,
  definirNovaSenha,
  entrar,
  pedirNovaSenha,
  salvarPerfil,
  trocarSenha,
  type Resultado,
} from '@/app/(public)/conta/_acoes';
import { formatarCnpj, formatarTelefone, SENHA_MIN, type Perfil } from '@/lib/contas/regras';

/* ─── Peças ─────────────────────────────────────────────────────────────── */

function Aviso({ r }: { r: Resultado | null }) {
  if (!r) return null;
  if (r.ok) return r.mensagem ? <p className="uni-conta-aviso is-ok" role="status">{r.mensagem}</p> : null;
  return <p className="uni-conta-aviso is-erro" role="alert">{r.erro}</p>;
}

type CampoProps = {
  nome: string;
  rotulo: string;
  r: Resultado | null;
  tipo?: string;
  auto?: string;
  valor?: string;
  dica?: ReactNode;
  mascara?: (v: string) => string;
  modo?: 'numeric' | 'tel' | 'email' | 'text';
  max?: number;
};

function Campo({ nome, rotulo, r, tipo = 'text', auto, valor, dica, mascara, modo, max }: CampoProps) {
  const id = useId();
  const erro = r && !r.ok ? r.campos?.[nome] : undefined;
  const [v, setV] = useState(valor ?? '');
  const [ver, setVer] = useState(false);
  const senha = tipo === 'password';
  return (
    <label className={'uni-conta-campo' + (erro ? ' has-erro' : '')} htmlFor={id}>
      <span>{rotulo}</span>
      <div className="uni-conta-input">
        <input
          id={id}
          name={nome}
          type={senha && ver ? 'text' : tipo}
          autoComplete={auto}
          inputMode={modo}
          maxLength={max}
          value={v}
          onChange={(e) => setV(mascara ? mascara(e.target.value) : e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro || dica ? `${id}-d` : undefined}
          required
        />
        {senha && (
          <button type="button" className="uni-conta-ver" onClick={() => setVer((x) => !x)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}>
            {ver ? 'Esconder' : 'Mostrar'}
          </button>
        )}
      </div>
      {(erro || dica) && (
        <small id={`${id}-d`} className={erro ? 'is-erro' : undefined}>
          {erro ?? dica}
        </small>
      )}
    </label>
  );
}

function Enviar({ pendente, children }: { pendente: boolean; children: ReactNode }) {
  return (
    <button type="submit" className="uni-conta-btn" disabled={pendente} aria-busy={pendente}>
      {pendente ? 'Aguarde…' : children}
    </button>
  );
}

const DICA_SENHA = `Pelo menos ${SENHA_MIN} caracteres, com letras e números.`;

/* ─── Formulários ───────────────────────────────────────────────────────── */

export function FormEntrar({ next }: { next?: string }) {
  const [r, acao, pendente] = useActionState(entrar, null);
  return (
    <form action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <input type="hidden" name="next" value={next ?? ''} />
      <Campo nome="email" rotulo="E-mail" tipo="email" auto="email" modo="email" r={r} max={254} />
      <Campo nome="senha" rotulo="Senha" tipo="password" auto="current-password" r={r} max={200} />
      <p className="uni-conta-linha-dir">
        <Link href="/conta/esqueci-senha">Esqueci minha senha</Link>
      </p>
      <Enviar pendente={pendente}>Entrar</Enviar>
      <p className="uni-conta-rodape">
        Ainda não tem conta? <Link href="/conta/cadastro">Criar conta de atacado</Link>
      </p>
    </form>
  );
}

export function FormCadastro() {
  const [r, acao, pendente] = useActionState(cadastrar, null);
  const [aceite, setAceite] = useState(false);
  if (r?.ok) {
    return (
      <div className="uni-conta-feito" role="status">
        <h2>Confira seu e-mail</h2>
        <p>
          Se <strong>{r.mensagem}</strong> ainda não tinha conta, mandamos um link para ativar. Abra o e-mail e toque em
          “Confirmar meu e-mail”.
        </p>
        <p className="uni-conta-pequeno">Não chegou em alguns minutos? Olhe a caixa de spam ou promoções.</p>
        <Link className="uni-conta-btn is-linha" href="/conta/entrar">
          Ir para o login
        </Link>
      </div>
    );
  }
  return (
    <form action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <div className="uni-conta-grade">
        <Campo nome="nome" rotulo="Seu nome" auto="name" r={r} max={80} />
        <Campo nome="empresa" rotulo="Loja ou razão social" auto="organization" r={r} max={120} />
        <Campo nome="cnpj" rotulo="CNPJ" modo="numeric" mascara={formatarCnpj} r={r} max={18} />
        <Campo nome="telefone" rotulo="WhatsApp com DDD" tipo="tel" auto="tel-national" modo="tel" mascara={formatarTelefone} r={r} max={16} />
      </div>
      <Campo nome="email" rotulo="E-mail" tipo="email" auto="email" modo="email" r={r} max={254} />
      <Campo nome="senha" rotulo="Crie uma senha" tipo="password" auto="new-password" r={r} dica={DICA_SENHA} max={200} />
      {/* Armadilha pra robô: escondida de gente, fora da ordem do Tab. */}
      <div className="uni-conta-isca" aria-hidden="true">
        <label>
          Site <input type="text" name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <label className={'uni-conta-aceite' + (r && !r.ok && r.campos?.aceite ? ' has-erro' : '')}>
        <input type="checkbox" name="aceite" required checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
        <span>
          Li e aceito a <Link href="/privacidade" target="_blank">Política de Privacidade</Link>. Usamos seus dados só para
          atender seus pedidos.
        </span>
      </label>
      {r && !r.ok && r.campos?.aceite && <small className="uni-conta-erro-solto">{r.campos.aceite}</small>}
      <Enviar pendente={pendente}>Criar conta</Enviar>
      <p className="uni-conta-rodape">
        Já tem conta? <Link href="/conta/entrar">Entrar</Link>
      </p>
    </form>
  );
}

export function FormEsqueci() {
  const [r, acao, pendente] = useActionState(pedirNovaSenha, null);
  if (r?.ok) {
    return (
      <div className="uni-conta-feito" role="status">
        <h2>Confira seu e-mail</h2>
        <p>
          Se existir uma conta com <strong>{r.mensagem}</strong>, mandamos um link para criar uma senha nova. O link só funciona
          uma vez.
        </p>
        <p className="uni-conta-pequeno">Não chegou? Olhe o spam, ou peça de novo daqui a alguns minutos.</p>
        <Link className="uni-conta-btn is-linha" href="/conta/entrar">
          Voltar para o login
        </Link>
      </div>
    );
  }
  return (
    <form action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <Campo nome="email" rotulo="E-mail da conta" tipo="email" auto="email" modo="email" r={r} max={254} />
      <Enviar pendente={pendente}>Mandar link</Enviar>
      <p className="uni-conta-rodape">
        Lembrou? <Link href="/conta/entrar">Entrar</Link>
      </p>
    </form>
  );
}

export function FormConfirmar({ tipo, t }: { tipo: string; t: string }) {
  const [r, acao, pendente] = useActionState(confirmarLink, null);
  return (
    <form action={acao} className="uni-conta-form">
      <Aviso r={r} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="t" value={t} />
      <Enviar pendente={pendente}>{tipo === 'senha' ? 'Continuar para a nova senha' : 'Ativar minha conta'}</Enviar>
      {r && !r.ok && (
        <p className="uni-conta-rodape">
          {tipo === 'senha' ? <Link href="/conta/esqueci-senha">Pedir outro link</Link> : <Link href="/conta/entrar">Ir para o login</Link>}
        </p>
      )}
    </form>
  );
}

export function FormNovaSenha() {
  const [r, acao, pendente] = useActionState(definirNovaSenha, null);
  return (
    <form action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <Campo nome="senha" rotulo="Nova senha" tipo="password" auto="new-password" r={r} dica={DICA_SENHA} max={200} />
      <Campo nome="confirmar" rotulo="Repita a nova senha" tipo="password" auto="new-password" r={r} max={200} />
      <Enviar pendente={pendente}>Salvar nova senha</Enviar>
    </form>
  );
}

export function FormPerfil({ perfil }: { perfil: Partial<Perfil> }) {
  const [r, acao, pendente] = useActionState(salvarPerfil, null);
  return (
    <form action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <div className="uni-conta-grade">
        <Campo nome="nome" rotulo="Seu nome" auto="name" valor={perfil.nome} r={r} max={80} />
        <Campo nome="empresa" rotulo="Loja ou razão social" auto="organization" valor={perfil.empresa} r={r} max={120} />
        <Campo nome="cnpj" rotulo="CNPJ" modo="numeric" mascara={formatarCnpj} valor={perfil.cnpj} r={r} max={18} />
        <Campo nome="telefone" rotulo="WhatsApp com DDD" tipo="tel" auto="tel-national" modo="tel" mascara={formatarTelefone} valor={perfil.telefone} r={r} max={16} />
      </div>
      <Enviar pendente={pendente}>Salvar dados</Enviar>
    </form>
  );
}

export function FormTrocarSenha() {
  const [r, acao, pendente] = useActionState(trocarSenha, null);
  // Depois de trocar com sucesso, o formulário volta vazio (chave nova).
  return (
    <form key={r?.ok ? 'feito' : 'aberto'} action={acao} className="uni-conta-form" noValidate>
      <Aviso r={r} />
      <Campo nome="atual" rotulo="Senha atual" tipo="password" auto="current-password" r={r} dica="A que você usa para entrar no site." max={200} />
      <Campo nome="senha" rotulo="Nova senha" tipo="password" auto="new-password" r={r} dica={DICA_SENHA} max={200} />
      <Campo nome="confirmar" rotulo="Repita a nova senha" tipo="password" auto="new-password" r={r} max={200} />
      <Enviar pendente={pendente}>Trocar senha</Enviar>
    </form>
  );
}
