'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BagIcon, CloseIcon, WhatsAppIcon } from '@/components/public/icons';
import { usePedido } from '@/hooks/usePedido';
import { sendHit } from '@/lib/analytics/client';
import { gaEvent } from '@/lib/analytics/google';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { formatPriceBRL } from '@/lib/format';
import {
  abrirPedido,
  limparPedido,
  linkPedidoWhatsApp,
  mudarQuantidade,
  PEDIDO_ABRIR_EVENT,
  PEDIDO_ADICIONADO_EVENT,
  QTD_MAXIMA,
  readContato,
  removerDoPedido,
  resumoPedido,
  variacao,
  writeContato,
  type PedidoContato,
} from '@/lib/pedido';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { useContasVisiveis } from '@/components/public/conta/ContaBotao';
import { waGeneral } from '@/lib/whatsapp';

/** Quanto tempo a barra mostra "Peça adicionada" antes de voltar ao resumo. */
const AVISO_MS = 3200;

/** Páginas em que a barra do pedido sairia do caminho (ou já é o próprio pedido). */
const SEM_BARRA = ['/finalizar', '/pedido/', '/conta'];

/**
 * A gaveta do pedido de atacado, montada uma vez no layout público.
 *
 * Qualquer parte do site a abre com `abrirPedido()` (o ícone do cabeçalho, a
 * barra do pedido). Enquanto houver peças, a barra fica fixa embaixo com o
 * resumo, quantas faltam pro mínimo e o próximo passo ("Ver pedido" ou
 * "Finalizar compra"). Quando uma peça entra, ela pisca "Peça adicionada".
 */
export function PedidoDrawer() {
  const items = usePedido();
  const [aberto, setAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [aviso, setAviso] = useState<{ name: string; qty: number } | null>(null);
  const [contato, setContato] = useState<PedidoContato>({ nome: '', local: '' });
  const painelRef = useRef<HTMLDivElement>(null);
  const voltarFocoRef = useRef<HTMLElement | null>(null);

  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    const onAbrir = () => {
      voltarFocoRef.current = document.activeElement as HTMLElement | null;
      setContato(readContato());
      setEnviado(false);
      setAviso(null);
      setAberto(true);
    };
    window.addEventListener(PEDIDO_ABRIR_EVENT, onAbrir);
    return () => window.removeEventListener(PEDIDO_ABRIR_EVENT, onAbrir);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAdd = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; qty: number }>).detail;
      setAviso(d);
      setEnviado(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setAviso(null), AVISO_MS);
      gaEvent('pedido_adicionar', { peca: d.name, quantidade: d.qty });
    };
    window.addEventListener(PEDIDO_ADICIONADO_EVENT, onAdd);
    return () => {
      window.removeEventListener(PEDIDO_ADICIONADO_EVENT, onAdd);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Gaveta aberta: trava a página de trás, Esc fecha, e o foco entra no painel
  // e volta pro botão que abriu quando ela fecha.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    painelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', onKey);
    const voltar = voltarFocoRef.current;
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', onKey);
      voltar?.focus?.();
    };
  }, [aberto, fechar]);

  const { pecas, total, faltam } = resumoPedido(items);
  /* Com as contas ligadas (ou na prévia), a compra é pelo site: o botão vira
     "Finalizar compra" e o WhatsApp fica só para dúvidas. Desligadas, tudo
     continua como sempre, pelo WhatsApp. */
  const compraNoSite = useContasVisiveis();
  const progresso = Math.min(1, pecas / PEDIDO_MINIMO);
  const pathname = usePathname() ?? '';
  const escondeBarra = SEM_BARRA.some((r) => pathname === r || pathname.startsWith(r.endsWith('/') ? r : r + '/'));

  const mudarContato = (campo: keyof PedidoContato, valor: string) => {
    const novo = { ...contato, [campo]: valor };
    setContato(novo);
    writeContato(novo);
  };

  const enviar = () => {
    // Cada peça conta como um clique de WhatsApp nela: é o que o painel usa
    // pra dizer quais modelos mais viram pedido.
    for (const slug of new Set(items.map((i) => i.slug))) {
      sendHit({ path: `/produtos/${slug}`, kind: 'wa' });
    }
    gaEvent('pedido_enviado', { pecas, modelos: items.length, valor: total });
    setEnviado(true);
  };

  return (
    <>
      {pecas > 0 && !aberto && !escondeBarra && (
        <div
          className={'uni-pedido-fixa' + (aviso ? ' is-novo' : '') + (faltam === 0 ? ' is-pronto' : '')}
          role="region"
          aria-label="Seu pedido"
        >
          <button
            type="button"
            className="uni-pedido-fixa-info"
            onClick={abrirPedido}
            aria-label={`Ver pedido: ${pecas} ${pecas === 1 ? 'peça' : 'peças'}, ${formatPriceBRL(total)}`}
          >
            <span className="uni-pedido-fixa-icone" aria-hidden="true">
              <BagIcon size={18} />
              <span>{pecas > 99 ? '99+' : pecas}</span>
            </span>
            <span className="uni-pedido-fixa-texto">
              <span className="uni-pedido-fixa-linha1" role="status">
                {aviso ? (
                  <strong>✓ {aviso.qty > 1 ? `${aviso.qty} peças adicionadas` : 'Peça adicionada'}</strong>
                ) : (
                  <>
                    <strong>
                      {pecas} {pecas === 1 ? 'peça' : 'peças'}
                    </strong>{' '}
                    · <span className="uni-pedido-fixa-total">{formatPriceBRL(total)}</span>
                  </>
                )}
              </span>
              <span className="uni-pedido-fixa-linha2">
                {faltam > 0
                  ? `Falta${faltam === 1 ? '' : 'm'} ${faltam} ${faltam === 1 ? 'peça' : 'peças'} pro mínimo de ${PEDIDO_MINIMO}`
                  : 'Pedido mínimo atingido ✓'}
              </span>
              <span className="uni-pedido-fixa-progresso" aria-hidden="true">
                <span style={{ width: `${progresso * 100}%` }} />
              </span>
            </span>
          </button>
          {compraNoSite && faltam === 0 ? (
            <Link href="/finalizar" className="uni-pedido-fixa-cta">
              Finalizar compra
            </Link>
          ) : (
            <button type="button" className="uni-pedido-fixa-cta is-secundario" onClick={abrirPedido}>
              {faltam === 0 ? 'Enviar pedido' : 'Ver pedido'}
            </button>
          )}
        </div>
      )}
      {aberto && (
        <div className="uni-pedido-overlay" onClick={fechar}>
          <div
            className="uni-pedido"
            role="dialog"
            aria-modal="true"
            aria-labelledby="uni-pedido-titulo"
            tabIndex={-1}
            ref={painelRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uni-pedido-head">
              <h2 id="uni-pedido-titulo">Seu pedido</h2>
              <button
                type="button"
                className="uni-pedido-close"
                onClick={fechar}
                aria-label="Fechar pedido"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="uni-pedido-vazio">
                <BagIcon size={40} />
                <p>
                  Seu pedido está vazio. Escolha as peças no catálogo e toque em
                  “Adicionar”.
                </p>
                <Link href="/#catalogo" className="uni-pedido-btn" onClick={fechar}>
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <>
                <div className="uni-pedido-meta">
                  <p>
                    {faltam > 0 ? (
                      <>
                        Faltam <strong>{faltam}</strong>{' '}
                        {faltam === 1 ? 'peça' : 'peças'} pro pedido mínimo de{' '}
                        {PEDIDO_MINIMO}.
                      </>
                    ) : (
                      <>
                        Pedido mínimo atingido · <strong>{pecas} peças</strong>
                      </>
                    )}
                  </p>
                  <div
                    className="uni-pedido-barra"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={PEDIDO_MINIMO}
                    aria-valuenow={Math.min(pecas, PEDIDO_MINIMO)}
                    aria-label="Pedido mínimo"
                  >
                    <span style={{ transform: `scaleX(${progresso})` }} />
                  </div>
                </div>

                {/* Lista e campos rolam juntos; o topo (mínimo) e o rodapé
                    (total e envio) ficam sempre à vista. */}
                <div className="uni-pedido-corpo">
                  <ul className="uni-pedido-lista">
                    {items.map((item) => {
                      const v = variacao(item);
                      return (
                        <li key={item.key} className="uni-pedido-item">
                          <Link
                            href={`/produtos/${item.slug}`}
                            className="uni-pedido-thumb"
                            onClick={fechar}
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            {item.image && (
                              <Image
                                src={publicImageUrl(item.image)}
                                alt=""
                                fill
                                sizes="72px"
                              />
                            )}
                          </Link>
                          <div className="uni-pedido-item-info">
                            <Link
                              href={`/produtos/${item.slug}`}
                              className="uni-pedido-item-nome"
                              onClick={fechar}
                            >
                              {item.name}
                            </Link>
                            {v && <span className="uni-pedido-item-var">{v}</span>}
                            <span className="uni-pedido-item-preco">
                              {formatPriceBRL(item.unitPrice)} cada
                            </span>
                            <div className="uni-pedido-item-acoes">
                              <div
                                className="uni-qty is-small"
                                role="group"
                                aria-label={`Quantidade de ${item.name}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => mudarQuantidade(item.key, item.qty - 1)}
                                  aria-label="Diminuir quantidade"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={QTD_MAXIMA}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const n = Number(e.target.value);
                                    if (n >= 1) mudarQuantidade(item.key, n);
                                  }}
                                  aria-label="Quantidade"
                                />
                                <button
                                  type="button"
                                  onClick={() => mudarQuantidade(item.key, item.qty + 1)}
                                  aria-label="Aumentar quantidade"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                className="uni-pedido-remover"
                                onClick={() => removerDoPedido(item.key)}
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                          <span className="uni-pedido-item-sub">
                            {formatPriceBRL(item.qty * item.unitPrice)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {!compraNoSite && (
                  <div className="uni-pedido-campos">
                    <label>
                      <span>Nome ou loja (opcional)</span>
                      <input
                        type="text"
                        value={contato.nome}
                        onChange={(e) => mudarContato('nome', e.target.value)}
                        autoComplete="organization"
                        maxLength={80}
                      />
                    </label>
                    <label>
                      <span>CEP ou cidade (opcional)</span>
                      <input
                        type="text"
                        value={contato.local}
                        onChange={(e) => mudarContato('local', e.target.value)}
                        autoComplete="postal-code"
                        maxLength={60}
                      />
                    </label>
                  </div>
                  )}
                </div>

                <div className="uni-pedido-foot">
                  <div className="uni-pedido-total">
                    <span>
                      Total estimado · {pecas} {pecas === 1 ? 'peça' : 'peças'}
                    </span>
                    <strong>{formatPriceBRL(total)}</strong>
                  </div>
                  <p className="uni-pedido-obs">
                    {compraNoSite
                      ? 'Frete e forma de pagamento você escolhe no próximo passo.'
                      : 'Preços do site. Disponibilidade e frete são confirmados na conversa.'}
                  </p>
                  {enviado ? (
                    <div className="uni-pedido-enviado" role="status">
                      <p>
                        Abrimos o WhatsApp com o seu pedido. Depois de enviar a
                        mensagem, pode limpar a lista.
                      </p>
                      <div className="uni-pedido-enviado-acoes">
                        <button
                          type="button"
                          className="uni-pedido-btn is-ghost"
                          onClick={() => {
                            limparPedido();
                            fechar();
                          }}
                        >
                          Limpar pedido
                        </button>
                        <button
                          type="button"
                          className="uni-pedido-btn"
                          onClick={() => setEnviado(false)}
                        >
                          Voltar ao pedido
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {compraNoSite ? (
                        faltam > 0 ? (
                          <button type="button" className="uni-pedido-enviar is-site" disabled>
                            Adicione mais {faltam} {faltam === 1 ? 'peça' : 'peças'} pra
                            finalizar
                          </button>
                        ) : (
                          <Link href="/finalizar" className="uni-pedido-enviar is-site" onClick={fechar}>
                            Finalizar compra
                          </Link>
                        )
                      ) : faltam > 0 ? (
                        <button type="button" className="uni-pedido-enviar" disabled>
                          Adicione mais {faltam} {faltam === 1 ? 'peça' : 'peças'} pra
                          enviar
                        </button>
                      ) : (
                        <a
                          href={linkPedidoWhatsApp(items, contato)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="uni-pedido-enviar"
                          onClick={enviar}
                        >
                          <WhatsAppIcon size={18} />
                          Enviar pedido pelo WhatsApp
                        </a>
                      )}
                      {compraNoSite && (
                        <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="uni-pedido-duvida">
                          Dúvidas? Fale com a gente no WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        className="uni-pedido-limpar"
                        onClick={() => {
                          if (window.confirm('Tirar todas as peças do pedido?')) {
                            limparPedido();
                          }
                        }}
                      >
                        Limpar pedido
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** O ícone do pedido no cabeçalho, com a contagem de peças. */
export function PedidoBotao({ className }: { className?: string }) {
  const items = usePedido();
  const { pecas } = resumoPedido(items);
  return (
    <button
      type="button"
      className={'uni-pedido-icone ' + (className ?? '')}
      onClick={abrirPedido}
      aria-label={
        pecas > 0
          ? `Abrir pedido, ${pecas} ${pecas === 1 ? 'peça' : 'peças'}`
          : 'Abrir pedido'
      }
    >
      <BagIcon size={20} />
      {pecas > 0 && <span className="uni-pedido-icone-n">{pecas > 99 ? '99+' : pecas}</span>}
    </button>
  );
}
