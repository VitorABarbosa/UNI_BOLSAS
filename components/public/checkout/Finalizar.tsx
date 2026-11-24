'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePedido } from '@/hooks/usePedido';
import { removerDoPedido } from '@/lib/pedido';
import { formatPriceBRL } from '@/lib/format';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { STORE } from '@/lib/content/store';
import { waGeneral } from '@/lib/whatsapp';
import { cotar, cotarEnvio, iniciarPagamento } from '@/app/(public)/finalizar/_acoes';
import { soDigitos } from '@/lib/contas/regras';
import type { Cotacao, EntregaTipo } from '@/lib/checkout/tipos';

type OpcaoFrete = { id: number; nome: string; transportadora: string; preco: number; prazoMin: number; prazoMax: number };
const prazo = (o: OpcaoFrete) => (o.prazoMin === o.prazoMax ? `${o.prazoMax} dias úteis` : `${o.prazoMin} a ${o.prazoMax} dias úteis`);
import type { Perfil } from '@/lib/contas/regras';
import { FormPerfil } from '@/components/public/conta/Formularios';

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
  const [modo, setModo] = useState<'retirada' | 'enviar'>('retirada');
  /** Serviço de frete escolhido (id do Melhor Envio) ou "a combinar". */
  const [servico, setServico] = useState<number | 'combinar' | null>(null);
  const [fretes, setFretes] = useState<{ cep: string; chave: string; opcoes: OpcaoFrete[]; caixas: string } | null>(null);
  const [freteMsg, setFreteMsg] = useState<string | null>(null);
  const [calculando, startCalcular] = useTransition();
  const [end, setEnd] = useState<EnderecoForm>(ENDERECO_VAZIO);
  const [erro, setErro] = useState<{ msg: string; campos?: Record<string, string> } | null>(null);
  const [pagando, startPagar] = useTransition();
  const [indo, setIndo] = useState(false);
  const [editandoDados, setEditandoDados] = useState(false);

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

  // O frete calculado só vale pro CEP e pro pedido com que foi calculado.
  const fretesValidos = fretes && fretes.cep === soDigitos(end.cep) && fretes.chave === chave ? fretes : null;
  const opcaoSel = fretesValidos && typeof servico === 'number' ? (fretesValidos.opcoes.find((o) => o.id === servico) ?? null) : null;
  const entrega: EntregaTipo = modo === 'retirada' ? 'retirada' : servico === 'combinar' ? 'combinar' : 'envio';
  const freteEscolhido = modo === 'retirada' || servico === 'combinar' || !!opcaoSel;
  const totalAgora = c.total + (modo === 'enviar' && opcaoSel ? opcaoSel.preco : 0);

  const calcularFrete = () => {
    setFreteMsg(null);
    const cep = soDigitos(end.cep);
    if (cep.length !== 8) {
      setFreteMsg('Digite o CEP com 8 números.');
      return;
    }
    startCalcular(async () => {
      const r = await cotarEnvio(enviados, cep);
      if (r.ok) {
        setFretes({ cep, chave, opcoes: r.opcoes, caixas: r.caixas });
        setServico(r.opcoes[0]?.id ?? null);
      } else {
        setFretes(null);
        setFreteMsg(r.erro);
        if (r.semCalculo) setServico('combinar');
      }
    });
  };

  const pagar = () => {
    setErro(null);
    startPagar(async () => {
      const r = await iniciarPagamento({
        itens: enviados,
        entrega,
        endereco: modo === 'enviar' ? end : undefined,
        servicoFrete: entrega === 'envio' && opcaoSel ? opcaoSel.id : undefined,
      });
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
        {dadosOk && !editandoDados ? (
          <p className="uni-checkout-dados">
            <strong>{perfil.empresa}</strong> · CNPJ {perfil.cnpj}
            <br />
            {perfil.nome} · {perfil.telefone} · {email}
            <br />
            <button type="button" className="uni-checkout-link" onClick={() => setEditandoDados(true)}>
              Alterar dados
            </button>
          </p>
        ) : (
          <div className="uni-checkout-perfil">
            {!dadosOk && (
              <p className="uni-conta-pequeno">
                Preencha uma vez: os dados ficam salvos na sua conta e vão no pedido e na nota fiscal.
              </p>
            )}
            <FormPerfil perfil={perfil} aoSalvar={() => setEditandoDados(false)} />
          </div>
        )}
      </section>

      <section className="uni-conta-bloco">
        <h2>Como receber</h2>
        <div className="uni-checkout-opcoes" role="radiogroup" aria-label="Como receber">
          <label className={'uni-checkout-opcao' + (modo === 'retirada' ? ' is-sel' : '')}>
            <input type="radio" name="entrega" checked={modo === 'retirada'} onChange={() => setModo('retirada')} />
            <span>
              <strong>Retirar na loja</strong>
              <small>
                {STORE.name}, {STORE.unitText} · {STORE.street}, {STORE.district}. Avisamos quando estiver separado.
              </small>
            </span>
            <em className="is-gratis">Grátis</em>
          </label>
          <label className={'uni-checkout-opcao' + (modo === 'enviar' ? ' is-sel' : '')}>
            <input type="radio" name="entrega" checked={modo === 'enviar'} onChange={() => setModo('enviar')} />
            <span>
              <strong>Receber pelo correio ou transportadora</strong>
              <small>Frete calculado pelo CEP. Enviamos de São Paulo/SP.</small>
            </span>
            <em>{opcaoSel ? formatPriceBRL(opcaoSel.preco) : 'pelo CEP'}</em>
          </label>
        </div>

        {modo === 'enviar' && (
          <div className="uni-checkout-endereco">
            <div className="uni-checkout-cep">
              {campo('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 9 })}
              <button type="button" className="uni-conta-btn is-linha" onClick={calcularFrete} disabled={calculando}>
                {calculando ? 'Calculando…' : fretesValidos ? 'Recalcular' : 'Calcular frete'}
              </button>
            </div>
            {freteMsg && <p className="uni-conta-aviso is-erro" role="alert">{freteMsg}</p>}
            {(fretesValidos || servico === 'combinar') && (
              <div className="uni-checkout-opcoes is-fretes" role="radiogroup" aria-label="Opções de frete">
                {fretesValidos?.opcoes.map((o) => (
                  <label key={o.id} className={'uni-checkout-opcao' + (servico === o.id ? ' is-sel' : '')}>
                    <input type="radio" name="frete" checked={servico === o.id} onChange={() => setServico(o.id)} />
                    <span>
                      <strong>
                        {o.transportadora} {o.nome}
                      </strong>
                      <small>Chega em {prazo(o)} depois do pagamento</small>
                    </span>
                    <em>{formatPriceBRL(o.preco)}</em>
                  </label>
                ))}
                <label className={'uni-checkout-opcao' + (servico === 'combinar' ? ' is-sel' : '')}>
                  <input type="radio" name="frete" checked={servico === 'combinar'} onChange={() => setServico('combinar')} />
                  <span>
                    <strong>Combinar o frete pelo WhatsApp</strong>
                    <small>Você paga as peças agora e o frete à parte, depois de combinar com a gente.</small>
                  </span>
                  <em>A combinar</em>
                </label>
              </div>
            )}
            <div className="uni-conta-grade">
              {campo('numero', 'Número', { autoComplete: 'address-line2', maxLength: 20 })}
              {campo('complemento', 'Complemento (opcional)', { maxLength: 60 })}
            </div>
            {campo('rua', 'Rua', { autoComplete: 'address-line1', maxLength: 120 })}
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
          <span>
            {modo === 'retirada' ? 'Grátis' : opcaoSel ? formatPriceBRL(opcaoSel.preco) : servico === 'combinar' ? 'A combinar' : 'Calcule pelo CEP'}
          </span>
        </div>
        <div className="is-grande">
          <span>Total agora</span>
          <span>{formatPriceBRL(totalAgora)}</span>
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
            disabled={!dadosOk || pagando || indo || c.removidas.length > 0 || !freteEscolhido}
            onClick={pagar}
          >
            {pagando || indo
              ? 'Abrindo o Mercado Pago…'
              : !freteEscolhido
                ? 'Calcule o frete para continuar'
                : `Pagar ${formatPriceBRL(totalAgora)} com Mercado Pago`}
          </button>
        )}
        <p className="uni-conta-pequeno uni-checkout-nota">
          Pix, cartão ou boleto na tela segura do Mercado Pago. Os dados do cartão não passam pelo nosso site.
          <br />
          Ao pagar, você concorda com os <Link href="/termos" target="_blank">Termos de compra</Link> e a{' '}
          <Link href="/trocas" target="_blank">Política de trocas</Link>.
          <br />
          Dúvidas? <a href={waGeneral} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a>
        </p>
      </section>
    </div>
  );
}
