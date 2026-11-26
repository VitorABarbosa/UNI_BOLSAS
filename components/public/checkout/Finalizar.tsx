'use client';

import { rotuloDocumento } from '@/lib/contas/regras';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePedido } from '@/hooks/usePedido';
import { mudarQuantidade, QTD_MAXIMA, removerDoPedido } from '@/lib/pedido';
import { formatPriceBRL } from '@/lib/format';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { STORE } from '@/lib/content/store';
import { waGeneral } from '@/lib/whatsapp';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { cotar, cotarEnvio, iniciarPagamento } from '@/app/(public)/finalizar/_acoes';
import { enderecoCompleto, identidadeCompleta, soDigitos, type Perfil } from '@/lib/contas/regras';
import { buscarCep } from '@/lib/frete/cep';
import type { Cotacao } from '@/lib/checkout/tipos';
import { FormPerfil } from '@/components/public/conta/Formularios';

type OpcaoFrete = { id: number; nome: string; transportadora: string; preco: number; prazoMin: number; prazoMax: number };
const prazo = (o: OpcaoFrete) => (o.prazoMin === o.prazoMax ? `${o.prazoMax} dias úteis` : `${o.prazoMin} a ${o.prazoMax} dias úteis`);

type EnderecoForm = { cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
const ENDERECO_VAZIO: EnderecoForm = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

/**
 * A tela de finalizar compra. Os valores mostrados aqui vêm do servidor
 * (`cotar`), não do que o navegador guardou: é exatamente o que o Mercado
 * Pago vai cobrar.
 *
 * Entrega: retirada na loja ou envio com frete calculado (Melhor Envio).
 * Não existe "frete a combinar": se o frete não puder ser calculado, a
 * cliente retira na loja ou tira a dúvida no WhatsApp.
 */
export function Finalizar({ perfil, email, freteDisponivel }: { perfil: Partial<Perfil>; email: string; freteDisponivel: boolean }) {
  const itens = usePedido();
  const enviados = useMemo(
    () => itens.map((i) => ({ productId: i.productId, colorName: i.colorName, size: i.size, qty: i.qty })),
    [itens],
  );
  const chave = JSON.stringify(enviados);
  const qtyNaSacola = useMemo(() => new Map(itens.map((i) => [i.key, i.qty])), [itens]);

  const [cotacao, setCotacao] = useState<{ chave: string; c: Cotacao } | null>(null);
  const [erroCotacao, setErroCotacao] = useState<string | null>(null);
  const [modo, setModo] = useState<'retirada' | 'enviar'>('retirada');
  const [servico, setServico] = useState<number | null>(null);
  const [fretes, setFretes] = useState<{ cep: string; chave: string; opcoes: OpcaoFrete[] } | null>(null);
  const [freteMsg, setFreteMsg] = useState<string | null>(null);
  const [calculando, startCalcular] = useTransition();
  // O endereço vem da conta (salvo na última compra); dá pra trocar.
  const [end, setEnd] = useState<EnderecoForm>(() => ({
    ...ENDERECO_VAZIO,
    cep: perfil.cep ?? '',
    rua: perfil.rua ?? '',
    numero: perfil.numero ?? '',
    complemento: perfil.complemento ?? '',
    bairro: perfil.bairro ?? '',
    cidade: perfil.cidade ?? '',
    uf: perfil.uf ?? '',
  }));
  const [erro, setErro] = useState<{ msg: string; campos?: Record<string, string> } | null>(null);
  const [pagando, startPagar] = useTransition();
  const [indo, setIndo] = useState(false);
  const [editandoDados, setEditandoDados] = useState(false);
  const temEnderecoSalvo = enderecoCompleto(perfil);
  // Na retirada, o endereço só aparece se a conta ainda não tem um (a nota
  // fiscal precisa dele) ou se a cliente pedir pra trocar.
  const [trocandoEndereco, setTrocandoEndereco] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const cepBuscado = useRef(soDigitos(perfil.cep ?? ''));
  const numeroRef = useRef<HTMLInputElement>(null);

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

  const dadosOk = identidadeCompleta(perfil);

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

  if (erroCotacao) return <p className="uni-conta-aviso is-erro" role="alert">{erroCotacao}</p>;
  // Enquanto recalcula (mudou a quantidade), mostra a conta anterior apagada
  // em vez de sumir com a tela.
  const c = cotacao?.c;
  if (!c) return <p className="uni-conta-pequeno" aria-busy="true">Conferindo preços e disponibilidade…</p>;
  const atualizando = cotacao.chave !== chave;

  const keysValidas = new Set(c.linhas.map((l) => l.key));
  const faltam = Math.max(0, PEDIDO_MINIMO - c.pecas);

  // O frete calculado só vale pro CEP e pro pedido com que foi calculado.
  const fretesValidos = fretes && fretes.cep === soDigitos(end.cep) && fretes.chave === chave ? fretes : null;
  const opcaoSel = fretesValidos && servico != null ? (fretesValidos.opcoes.find((o) => o.id === servico) ?? null) : null;
  const freteEscolhido = modo === 'retirada' || !!opcaoSel;
  const totalAgora = c.total + (modo === 'enviar' && opcaoSel ? opcaoSel.preco : 0);

  const calcularFrete = (cepDigitado = end.cep) => {
    setFreteMsg(null);
    const cep = soDigitos(cepDigitado);
    if (cep.length !== 8) {
      setFreteMsg('Digite o CEP com 8 números.');
      return;
    }
    startCalcular(async () => {
      const r = await cotarEnvio(enviados, cep);
      if (r.ok) {
        setFretes({ cep, chave, opcoes: r.opcoes });
        setServico(r.opcoes[0]?.id ?? null);
      } else {
        setFretes(null);
        setServico(null);
        setFreteMsg(r.erro);
      }
    });
  };

  /** CEP completo: busca rua/bairro/cidade e, no envio, já calcula o frete. */
  const mudouCep = (valor: string) => {
    const d = soDigitos(valor);
    if (d.length !== 8 || d === cepBuscado.current) return;
    cepBuscado.current = d;
    if (modo === 'enviar') calcularFrete(d);
    setBuscandoCep(true);
    buscarCep(d)
      .then((a) => {
        if (!a || cepBuscado.current !== d) return;
        setEnd((x) => ({ ...x, rua: a.rua || x.rua, bairro: a.bairro || x.bairro, cidade: a.cidade, uf: a.uf }));
        setErro((er) => (er?.campos ? { ...er, campos: { ...er.campos, rua: '', bairro: '', cidade: '', uf: '' } } : er));
        numeroRef.current?.focus();
      })
      .finally(() => setBuscandoCep(false));
  };

  const escolherEnvio = () => {
    setModo('enviar');
    // Já tem CEP (da conta ou digitado): calcula sem precisar de clique.
    if (soDigitos(end.cep).length === 8 && !fretesValidos) calcularFrete();
  };

  const mostraEndereco = modo === 'enviar' || !temEnderecoSalvo || trocandoEndereco;

  const pagar = () => {
    setErro(null);
    startPagar(async () => {
      const r = await iniciarPagamento({
        itens: enviados,
        entrega: modo === 'retirada' ? 'retirada' : 'envio',
        endereco: mostraEndereco ? end : undefined,
        servicoFrete: modo === 'enviar' && opcaoSel ? opcaoSel.id : undefined,
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
            ref={k === 'numero' ? numeroRef : undefined}
            onChange={(e) => {
              const v = k === 'uf' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value;
              setEnd((x) => ({ ...x, [k]: v }));
              if (k === 'cep') mudouCep(v);
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

      <div className="uni-checkout-grade">
        <div className="uni-checkout-principal">
          <section className="uni-conta-bloco is-primeiro">
            <h2>
              Peças <small className="uni-checkout-conta">{c.pecas} {c.pecas === 1 ? 'peça' : 'peças'}</small>
            </h2>
            <ul className={'uni-checkout-linhas' + (atualizando ? ' is-atualizando' : '')}>
              {c.linhas.map((l) => {
                const qty = qtyNaSacola.get(l.key) ?? l.qty;
                return (
                  <li key={l.key} className="uni-checkout-linha">
                    <Link href={`/produtos/${l.slug}`} className="uni-checkout-foto" tabIndex={-1} aria-hidden="true">
                      {l.imagem && <Image src={publicImageUrl(l.imagem)} alt="" fill sizes="96px" />}
                    </Link>
                    <div className="uni-checkout-linha-info">
                      <Link href={`/produtos/${l.slug}`} className="uni-checkout-linha-nome">
                        {l.nome}
                      </Link>
                      {(l.cor || l.tamanho) && (
                        <span className="uni-checkout-linha-var">
                          {l.corHex && <i style={{ background: l.corHex }} aria-hidden="true" />}
                          {[l.cor, l.tamanho && `Tam. ${l.tamanho}`].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      <span className="uni-checkout-linha-preco">{formatPriceBRL(l.unitPrice)} cada</span>
                      <div className="uni-checkout-linha-acoes">
                        <div className="uni-qty is-small" role="group" aria-label={`Quantidade de ${l.nome}`}>
                          <button type="button" onClick={() => mudarQuantidade(l.key, qty - 1)} aria-label="Diminuir quantidade" disabled={qty <= 1}>
                            −
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={QTD_MAXIMA}
                            value={qty}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (n >= 1) mudarQuantidade(l.key, n);
                            }}
                            aria-label="Quantidade"
                          />
                          <button type="button" onClick={() => mudarQuantidade(l.key, qty + 1)} aria-label="Aumentar quantidade">
                            +
                          </button>
                        </div>
                        <button type="button" className="uni-checkout-remover" onClick={() => removerDoPedido(l.key)}>
                          Remover
                        </button>
                      </div>
                    </div>
                    <b className="uni-checkout-linha-total">{formatPriceBRL(l.subtotal)}</b>
                  </li>
                );
              })}
            </ul>
            <p className="uni-conta-pequeno">
              <Link href="/#catalogo">+ Adicionar mais peças</Link>
            </p>
          </section>

          <section className="uni-conta-bloco">
            <h2>Seus dados</h2>
            {dadosOk && !editandoDados ? (
              <p className="uni-checkout-dados">
                <strong>{perfil.empresa || perfil.nome}</strong> · {rotuloDocumento(perfil.cnpj)} {perfil.cnpj}
                <br />
                {perfil.empresa ? `${perfil.nome} · ` : ''}
                {perfil.telefone} · {email}
                <br />
                <button type="button" className="uni-checkout-link" onClick={() => setEditandoDados(true)}>
                  Alterar dados
                </button>
              </p>
            ) : (
              <div className="uni-checkout-perfil">
                <FormPerfil perfil={perfil} semEndereco aoSalvar={() => setEditandoDados(false)} />
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
              <label
                className={'uni-checkout-opcao' + (modo === 'enviar' ? ' is-sel' : '') + (freteDisponivel ? '' : ' is-off')}
              >
                <input
                  type="radio"
                  name="entrega"
                  checked={modo === 'enviar'}
                  onChange={escolherEnvio}
                  disabled={!freteDisponivel}
                />
                <span>
                  <strong>Receber pelo correio ou transportadora</strong>
                  <small>
                    {freteDisponivel
                      ? 'Frete calculado pelo CEP, com seguro. Enviamos de São Paulo/SP.'
                      : 'Em breve. Por enquanto, retire na loja.'}
                  </small>
                </span>
                <em>{opcaoSel ? formatPriceBRL(opcaoSel.preco) : freteDisponivel ? 'pelo CEP' : ''}</em>
              </label>
            </div>

            {modo === 'retirada' && temEnderecoSalvo && !trocandoEndereco && (
              <p className="uni-conta-pequeno uni-checkout-nf">
                Nota fiscal no seu endereço: {perfil.rua}, {perfil.numero} · {perfil.cidade}/{perfil.uf}.{' '}
                <button type="button" className="uni-checkout-link" onClick={() => setTrocandoEndereco(true)}>
                  Trocar
                </button>
              </p>
            )}

            {mostraEndereco && (
              <div className="uni-checkout-endereco">
                <h3 className="uni-checkout-subtitulo">
                  {modo === 'enviar' ? 'Endereço de entrega' : 'Seu endereço'}
                  <small>
                    {modo === 'enviar'
                      ? 'Vai na etiqueta e na nota fiscal, e fica salvo para as próximas compras.'
                      : 'Vai na nota fiscal e fica salvo para as próximas compras.'}
                  </small>
                </h3>
                <div className="uni-checkout-cep">
                  {campo('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 9 })}
                  {modo === 'enviar' ? (
                    <button type="button" className="uni-conta-btn is-linha" onClick={() => calcularFrete()} disabled={calculando}>
                      {calculando ? 'Calculando…' : fretesValidos ? 'Recalcular' : 'Calcular frete'}
                    </button>
                  ) : (
                    <span className="uni-conta-pequeno uni-checkout-cep-dica">{buscandoCep ? 'Buscando…' : ''}</span>
                  )}
                </div>
                {modo === 'enviar' && freteMsg && (
                  <p className="uni-conta-aviso is-erro" role="alert">
                    {freteMsg}
                  </p>
                )}
                {modo === 'enviar' && fretesValidos && (
                  <div className="uni-checkout-opcoes is-fretes" role="radiogroup" aria-label="Opções de frete">
                    {fretesValidos.opcoes.map((o) => (
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
                  </div>
                )}
                {campo('rua', 'Rua', { autoComplete: 'address-line1', maxLength: 120 })}
                <div className="uni-conta-grade">
                  {campo('numero', 'Número', { autoComplete: 'address-line2', maxLength: 20 })}
                  {campo('complemento', 'Complemento (opcional)', { maxLength: 60 })}
                </div>
                {campo('bairro', 'Bairro', { maxLength: 80 })}
                <div className="uni-conta-grade is-cidade">
                  {campo('cidade', 'Cidade', { autoComplete: 'address-level2', maxLength: 80 })}
                  {campo('uf', 'UF', { autoComplete: 'address-level1', maxLength: 2 })}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className={'uni-checkout-resumo' + (atualizando ? ' is-atualizando' : '')} aria-busy={atualizando}>
          <h2>Resumo do pedido</h2>
          <ul className="uni-checkout-miniaturas" aria-hidden="true">
            {c.linhas.slice(0, 6).map((l) => (
              <li key={l.key}>
                {l.imagem && <Image src={publicImageUrl(l.imagem)} alt="" fill sizes="48px" />}
                <span>{qtyNaSacola.get(l.key) ?? l.qty}</span>
              </li>
            ))}
            {c.linhas.length > 6 && <li className="is-mais">+{c.linhas.length - 6}</li>}
          </ul>
          <div className="uni-checkout-total">
            <div>
              <span>
                Peças ({c.pecas})
              </span>
              <span>{formatPriceBRL(c.total)}</span>
            </div>
            <div>
              <span>Frete{modo === 'enviar' && opcaoSel ? ` · ${opcaoSel.transportadora} ${opcaoSel.nome}` : ''}</span>
              <span>{modo === 'retirada' ? 'Grátis' : opcaoSel ? formatPriceBRL(opcaoSel.preco) : 'Calcule pelo CEP'}</span>
            </div>
            <div className="is-grande">
              <span>Total</span>
              <span>{formatPriceBRL(totalAgora)}</span>
            </div>
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
              disabled={!dadosOk || pagando || indo || atualizando || c.removidas.length > 0 || !freteEscolhido}
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
            Dúvidas?{' '}
            <a href={waGeneral} target="_blank" rel="noopener noreferrer">
              Fale com a gente no WhatsApp
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
