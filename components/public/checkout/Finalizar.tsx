'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePedido } from '@/hooks/usePedido';
import { removerDoPedido } from '@/lib/pedido';
import { formatPriceBRL } from '@/lib/format';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { STORE } from '@/lib/content/store';
import { waGeneral } from '@/lib/whatsapp';
import { cotar, iniciarPagamento } from '@/app/(public)/finalizar/_acoes';
import type { Cotacao, EntregaTipo } from '@/lib/checkout/tipos';
import type { Perfil } from '@/lib/contas/regras';

type EnderecoForm = { cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
const ENDERECO_VAZIO: EnderecoForm = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

/**
 * A tela de finalizar compra. Os valores mostrados aqui vêm do servidor
 * (`cotar`), não do que o navegador guardou: é exatamente o que o Mercado
 * Pago vai cobrar.
 */
export function Finalizar({ perfil, email }: { perfil: Partial<Perfil>; email: string }) {
  const itens = usePedido();
  const enviados = useMemo(
    () => itens.map((i) => ({ productId: i.productId, colorName: i.colorName, size: i.size, qty: i.qty })),
    [itens],
  );
  const chave = JSON.stringify(enviados);

  const [cotacao, setCotacao] = useState<{ chave: string; c: Cotacao } | null>(null);
  const [erroCotacao, setErroCotacao] = useState<string | null>(null);
  const [entrega, setEntrega] = useState<EntregaTipo>('retirada');
  const [end, setEnd] = useState<EnderecoForm>(ENDERECO_VAZIO);
  const [erro, setErro] = useState<{ msg: string; campos?: Record<string, string> } | null>(null);
  const [pagando, startPagar] = useTransition();
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    if (enviados.length === 0) return;
    let vivo = true;
    cotar(enviados).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setCotacao({ chave, c: r.cotacao });
        setErroCotacao(null);
      } else setErroCotacao(r.erro);
    });
    return () => {
      vivo = false;
    };
    // `chave` resume `enviados`: só recota quando o pedido muda de verdade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const dadosOk = !!(perfil.nome && perfil.empresa && perfil.cnpj && perfil.telefone);

  if (itens.length === 0) {
    return (
      <div className="uni-conta-feito">
        <p>Sua sacola está vazia.</p>
        <Link className="uni-conta-btn" href="/#catalogo">
          Ver o catálogo
        </Link>
      </div>
    );
  }

  const c = cotacao?.chave === chave ? cotacao.c : null;
  if (erroCotacao) return <p className="uni-conta-aviso is-erro" role="alert">{erroCotacao}</p>;
  if (!c) return <p className="uni-conta-pequeno" aria-busy="true">Conferindo preços e disponibilidade…</p>;

  const keysValidas = new Set(c.linhas.map((l) => l.key));
  const faltam = Math.max(0, PEDIDO_MINIMO - c.pecas);

  const pagar = () => {
    setErro(null);
    startPagar(async () => {
      const r = await iniciarPagamento({ itens: enviados, entrega, endereco: entrega === 'combinar' ? end : undefined });
      if (!r.ok) {
        setErro({ msg: r.erro, campos: r.campos });
        return;
      }
      setIndo(true);
      window.location.assign(r.url);
    });
  };

  const campo = (k: keyof EnderecoForm, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const msg = erro?.campos?.[k];
    return (
      <label className={'uni-conta-campo' + (msg ? ' has-erro' : '')}>
        <span>{rotulo}</span>
        <div className="uni-conta-input">
          <input
            name={k}
            value={end[k]}
            onChange={(e) => {
              setEnd((x) => ({ ...x, [k]: k === 'uf' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value }));
              // Corrigiu o campo: o aviso vermelho dele sai.
              if (msg) setErro((er) => (er ? { ...er, campos: { ...er.campos, [k]: '' } } : er));
            }}
            aria-invalid={msg ? true : undefined}
            {...props}
          />
        </div>
        {msg && <small className="is-erro">{msg}</small>}
      </label>
    );
  };

  return (
    <div className="uni-checkout">
      {c.removidas.length > 0 && (
        <div className="uni-conta-aviso is-erro" role="alert">
          <p style={{ margin: '0 0 8px' }}>Algumas peças não estão mais disponíveis do jeito que foram escolhidas:</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
            {c.removidas.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <button
            type="button"
            className="uni-conta-btn is-linha"
            onClick={() => itens.filter((i) => !keysValidas.has(i.key)).forEach((i) => removerDoPedido(i.key))}
          >
            Tirar essas peças do pedido
          </button>
        </div>
      )}

      <section className="uni-conta-bloco is-primeiro">
        <h2>Peças</h2>
        <ul className="uni-checkout-linhas">
          {c.linhas.map((l) => (
            <li key={l.key}>
              <div>
                <strong>{l.nome}</strong>
                <span>
                  {[l.cor, l.tamanho && `Tam. ${l.tamanho}`].filter(Boolean).join(' · ')}
                  {(l.cor || l.tamanho) && ' · '}
                  {l.qty} × {formatPriceBRL(l.unitPrice)}
                </span>
              </div>
              <b>{formatPriceBRL(l.subtotal)}</b>
            </li>
          ))}
        </ul>
        <p className="uni-conta-pequeno">
          Quer mudar alguma peça? Abra a sacola no topo da página.
        </p>
      </section>

      <section className="uni-conta-bloco">
        <h2>Seus dados</h2>
        {dadosOk ? (
          <p className="uni-checkout-dados">
            <strong>{perfil.empresa}</strong> · CNPJ {perfil.cnpj}
            <br />
            {perfil.nome} · {perfil.telefone} · {email}
            <br />
            <Link href="/conta">Alterar dados</Link>
          </p>
        ) : (
          <p className="uni-conta-aviso is-erro">
            Complete os dados da sua loja em <Link href="/conta">Minha conta</Link> antes de pagar.
          </p>
        )}
      </section>

      <section className="uni-conta-bloco">
        <h2>Como receber</h2>
        <div className="uni-checkout-opcoes" role="radiogroup" aria-label="Como receber">
          <label className={'uni-checkout-opcao' + (entrega === 'retirada' ? ' is-sel' : '')}>
            <input type="radio" name="entrega" checked={entrega === 'retirada'} onChange={() => setEntrega('retirada')} />
            <span>
              <strong>Retirar na loja</strong>
              <small>
                {STORE.name}, {STORE.unitText} · {STORE.street}, {STORE.district}. Avisamos quando estiver separado.
              </small>
            </span>
            <em className="is-gratis">Grátis</em>
          </label>
          <label className={'uni-checkout-opcao' + (entrega === 'combinar' ? ' is-sel' : '')}>
            <input type="radio" name="entrega" checked={entrega === 'combinar'} onChange={() => setEntrega('combinar')} />
            <span>
              <strong>Enviar pelo correio ou transportadora</strong>
              <small>O frete é combinado pelo WhatsApp depois do pagamento e cobrado à parte.</small>
            </span>
            <em>A combinar</em>
          </label>
        </div>

        {entrega === 'combinar' && (
          <div className="uni-checkout-endereco">
            <div className="uni-conta-grade">
              {campo('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 9 })}
              {campo('numero', 'Número', { autoComplete: 'address-line2', maxLength: 20 })}
            </div>
            {campo('rua', 'Rua', { autoComplete: 'address-line1', maxLength: 120 })}
            {campo('complemento', 'Complemento (opcional)', { maxLength: 60 })}
            {campo('bairro', 'Bairro', { maxLength: 80 })}
            <div className="uni-conta-grade is-cidade">
              {campo('cidade', 'Cidade', { autoComplete: 'address-level2', maxLength: 80 })}
              {campo('uf', 'UF', { autoComplete: 'address-level1', maxLength: 2 })}
            </div>
          </div>
        )}
      </section>

      <section className="uni-conta-bloco uni-checkout-total">
        <div>
          <span>
            {c.pecas} {c.pecas === 1 ? 'peça' : 'peças'}
          </span>
          <span>{formatPriceBRL(c.total)}</span>
        </div>
        <div>
          <span>Frete</span>
          <span>{entrega === 'retirada' ? 'Grátis' : 'A combinar'}</span>
        </div>
        <div className="is-grande">
          <span>Total agora</span>
          <span>{formatPriceBRL(c.total)}</span>
        </div>

        {erro && (
          <p className="uni-conta-aviso is-erro" role="alert">
            {erro.msg}
          </p>
        )}
        {faltam > 0 ? (
          <button type="button" className="uni-conta-btn" disabled>
            Faltam {faltam} {faltam === 1 ? 'peça' : 'peças'} para o mínimo de {PEDIDO_MINIMO}
          </button>
        ) : (
          <button
            type="button"
            className="uni-conta-btn uni-checkout-pagar"
            disabled={!dadosOk || pagando || indo || c.removidas.length > 0}
            onClick={pagar}
          >
            {pagando || indo ? 'Abrindo o Mercado Pago…' : `Pagar ${formatPriceBRL(c.total)} com Mercado Pago`}
          </button>
        )}
        <p className="uni-conta-pequeno uni-checkout-nota">
          Pix, cartão ou boleto na tela segura do Mercado Pago. Os dados do cartão não passam pelo nosso site.
          <br />
          Dúvidas? <a href={waGeneral} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a>
        </p>
      </section>
    </div>
  );
}
