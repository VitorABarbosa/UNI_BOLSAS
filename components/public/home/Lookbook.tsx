'use client';

/* eslint-disable @next/next/no-img-element -- recortes PNG/WebP com transparência, já no tamanho certo */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BagIcon } from '@/components/public/icons';
import { itemDaPeca } from '@/components/public/pedido/AdicionarAoPedido';
import { adicionarAoPedido } from '@/lib/pedido';
import { productPrice } from '@/lib/product-price';
import { nn, type LookConfig } from '@/lib/content/lookbook';
import type { ProductWithRelations } from '@/lib/queries/products';

export type LookDaVitrine = { cfg: LookConfig; product: ProductWithRelations };

/*
 * Passarela em profundidade: as modelos ficam numa fila que some no fundo,
 * à esquerda; arrastar (ou as setas) traz a próxima para a frente, e a
 * coluna da direita mostra a bolsa de cada look, pronta para o pedido.
 *
 * Uma posição (p, número com vírgula) comanda tudo: a profundidade de cada
 * modelo é wrap(i - p) e as paradas abaixo dizem posição, tamanho, desfoque
 * e opacidade em cada profundidade, de -1 (saindo pela frente) até 8.
 *
 * Só no computador: no celular a seção nem aparece (CSS) e as imagens nem
 * são baixadas (só carregam quando a tela é larga e a seção está perto).
 * O celular tem a sua versão, `LookbookCelular`, mais abaixo.
 */
const KX = [1.2, 0.7, 0.47, 0.33, 0.225, 0.145, 0.085, 0.05, 0.03, 0.02];
const KF = [1.14, 0.9, 0.79, 0.715, 0.66, 0.625, 0.598, 0.585, 0.575, 0.57];
const KH = [1.18, 0.84, 0.58, 0.44, 0.34, 0.265, 0.2, 0.16, 0.13, 0.11];
const KB = [0, 0, 1.2, 3.5, 7, 11, 16, 20, 22, 24];
const KO = [1, 1, 1, 1, 0.88, 0.55, 0, 0, 0, 0];

const wrap = (x: number, n: number) => ((x % n) + n) % n;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function Lookbook({ looks }: { looks: LookDaVitrine[] }) {
  const N = looks.length;
  const secao = useRef<HTMLElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const rolo = useRef<HTMLSpanElement>(null);
  const modelos = useRef<(HTMLDivElement | null)[]>([]);
  const cartoes = useRef<(HTMLElement | null)[]>([]);
  const alvo = useRef(0);
  const [ativo, setAtivo] = useState(false);
  const [atual, setAtual] = useState(0);
  const [adicionado, setAdicionado] = useState<number | null>(null);

  // Liga só em tela larga e quando a seção chega perto (as imagens vêm depois).
  useEffect(() => {
    const el = secao.current;
    if (!el || ativo) return;
    const larga = window.matchMedia('(min-width: 901px)');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && larga.matches) setAtivo(true);
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ativo]);

  // A passarela: um laço de animação que só desenha enquanto algo se move.
  useEffect(() => {
    if (!ativo) return;
    const stage = palco.current!;
    const rail = trilho.current!;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, base = 0, cardS = 0, p = alvo.current, last = 0, raf = 0, sujo = true, visivel = true, mostrado = -1;
    const cache = looks.map(() => ({ f: '', o: '' }));

    const medir = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      base = H * 1.2;
      modelos.current.forEach((m, i) => {
        if (!m) return;
        m.style.width = `${base * looks[i]!.cfg.proporcao}px`;
        m.style.height = `${base}px`;
      });
      cardS = rail.clientHeight / 3;
      cartoes.current.forEach((c) => c && (c.style.height = `${cardS}px`));
      sujo = true;
    };
    const pintar = () => {
      modelos.current.forEach((m, i) => {
        if (!m) return;
        let d = wrap(i - p, N);
        if (d > N - 1) d -= N;
        const k = clamp(d + 1, 0, KX.length - 1), a = Math.floor(k), b = Math.min(KX.length - 1, a + 1), t = k - a;
        const mix = (A: number[]) => A[a]! + (A[b]! - A[a]!) * t;
        const h = mix(KH) * H, s = h / base, w = h * looks[i]!.cfg.proporcao;
        const x = mix(KX) * W - w / 2, y = mix(KF) * H - h;
        m.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
        const f = mix(KB) / s, fs = f < 0.2 ? 'none' : `blur(${f.toFixed(1)}px)`, o = mix(KO).toFixed(3);
        if (fs !== cache[i]!.f) m.style.filter = cache[i]!.f = fs;
        if (o !== cache[i]!.o) {
          m.style.opacity = cache[i]!.o = o;
          m.style.visibility = o === '0.000' ? 'hidden' : 'visible';
        }
        m.style.zIndex = String(100 - Math.round(d * 10));
      });
      const todos = cardS * N;
      cartoes.current.forEach((c, i) => {
        if (!c) return;
        let y = wrap(i * cardS - p * cardS, todos);
        if (y > todos - cardS) y -= todos;
        c.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      });
      const r = rolo.current;
      if (r?.firstElementChild) {
        const lh = (r.firstElementChild as HTMLElement).offsetHeight;
        r.style.transform = `translate3d(0,${(-wrap(p, N) * lh).toFixed(1)}px,0)`;
      }
      const cur = wrap(Math.round(p), N);
      if (cur !== mostrado) {
        mostrado = cur;
        setAtual(cur);
      }
    };
    const quadro = (now: number) => {
      raf = requestAnimationFrame(quadro);
      if (!visivel) return;
      const dt = Math.min(50, now - last) || 16;
      last = now;
      const antes = p;
      const target = alvo.current;
      p = calm ? target : p + (target - p) * (1 - Math.exp(-dt * 0.0072));
      if (Math.abs(target - p) < 0.0004) p = target;
      if (p !== antes || sujo) {
        sujo = false;
        pintar();
      }
    };

    // Arrastar: o alvo segue o dedo/mouse; ao soltar, encaixa no look inteiro.
    let down = false, sx = 0, st = 0, moved = 0, wheelT = 0;
    const puxa = () => Math.max(150, W * 0.2);
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('button,a')) return;
      down = true;
      sx = e.clientX;
      st = alvo.current;
      moved = 0;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-drag');
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      alvo.current = st + dx / puxa();
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      stage.classList.remove('is-drag');
      if (moved < 6) {
        const hit = document.elementsFromPoint(e.clientX, e.clientY).find((x) => (x as HTMLElement).dataset?.lb);
        if (hit) {
          const d = Math.round(wrap(Number((hit as HTMLElement).dataset.lb) - alvo.current, N));
          if (d > 0 && d < N) alvo.current = Math.round(alvo.current) + d;
        }
      } else alvo.current = Math.round(alvo.current);
    };
    // Só o deslizar lateral do touchpad troca o look; a rodinha continua rolando a página.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      alvo.current += clamp(e.deltaX, -120, 120) / 420;
      clearTimeout(wheelT);
      wheelT = window.setTimeout(() => (alvo.current = Math.round(alvo.current)), 150);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        alvo.current = Math.round(alvo.current) + 1;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        alvo.current = Math.round(alvo.current) - 1;
      }
    };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('keydown', onKey);
    const io = new IntersectionObserver(([e]) => (visivel = !!e?.isIntersecting));
    io.observe(stage);
    const ro = new ResizeObserver(medir);
    ro.observe(stage);
    medir();
    raf = requestAnimationFrame(quadro);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelT);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('keydown', onKey);
    };
  }, [ativo, looks, N]);

  if (N === 0) return null;
  const mover = (d: number) => (alvo.current = Math.round(alvo.current) + d);

  return (
    <section className="uni-lb" id="lookbook" ref={secao} aria-label="Lookbook: uma bolsa para cada momento">
      <div
        className="uni-lb-palco"
        ref={palco}
        tabIndex={0}
        aria-label="Passarela de looks. Arraste ou use as setas do teclado para trocar o look."
      >
        <div className="uni-lb-fila">
          {ativo &&
            looks.map(({ cfg }, i) => (
              <div key={cfg.look} className="uni-lb-m" data-lb={i} ref={(el) => void (modelos.current[i] = el)}>
                <img src={`/lookbook/look-${nn(cfg.look)}.webp`} alt="" decoding="async" draggable={false} />
              </div>
            ))}
        </div>
        <div className="uni-lb-intro">
          <span className="uni-lb-sobre">Lookbook · Coleção 2026</span>
          <h2 className="uni-lb-titulo">
            Uma bolsa para <em>cada momento.</em>
          </h2>
          <p>
            Dez looks com bolsas do nosso atacado: da festa à academia, do escritório à praia. Arraste para trocar o look; a
            bolsa de cada um está ao lado, pronta para entrar no seu pedido.
          </p>
        </div>
        <div className="uni-lb-tag">
          <div className="uni-lb-look" aria-live="polite">
            <span className="uni-lb-rotulo">Look</span>
            <span className="uni-lb-janela">
              <span className="uni-lb-rolo" ref={rolo}>
                {[...looks, looks[0]!].map(({ cfg }, i) => (
                  <span key={i}>{nn(cfg.look)}</span>
                ))}
              </span>
            </span>
          </div>
          <span className="uni-lb-tema">{looks[atual]?.cfg.tema}</span>
          <span className="uni-lb-dica">Arraste para trocar o look</span>
        </div>
        <div className="uni-lb-setas">
          <button type="button" onClick={() => mover(-1)} aria-label="Look anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" onClick={() => mover(1)} aria-label="Próximo look">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="uni-lb-trilho" ref={trilho} aria-label="A bolsa de cada look">
        {looks.map(({ cfg, product }, i) => {
          const preco = productPrice(product);
          const cor = product.colors.find((c) => c.name.toLowerCase() === (cfg.cor ?? '').toLowerCase()) ?? null;
          return (
            <article key={cfg.look} className={`uni-lb-card${i % 2 ? ' is-alt' : ''}`} ref={(el) => void (cartoes.current[i] = el)}>
              <span className="uni-lb-n">
                Look {nn(cfg.look)} · {cfg.tema}
              </span>
              <Link href={`/produtos/${product.slug}`} className="uni-lb-foto" tabIndex={-1}>
                {ativo && <img src={`/lookbook/bolsa-${nn(cfg.look)}.webp`} alt={product.name} loading="lazy" />}
              </Link>
              <div className="uni-lb-meta">
                <Link href={`/produtos/${product.slug}`} className="uni-lb-nome">
                  {product.name}
                </Link>
                <span className="uni-lb-preco">
                  {preco.currentLabel} <small>no atacado</small>
                </span>
                <button
                  type="button"
                  className="uni-lb-comprar"
                  onClick={() => {
                    adicionarAoPedido(itemDaPeca(product, cor, undefined, cfg.fotoPedido));
                    setAdicionado(cfg.look);
                  }}
                >
                  <BagIcon size={13} />
                  {adicionado === cfg.look ? 'Adicionada' : 'Comprar'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** A chamada entre os Destaques e o catálogo: leva até a passarela. */
export function LookbookChamada({ looks }: { looks: LookDaVitrine[] }) {
  if (looks.length === 0) return null;
  return (
    <section className="uni-lb-chamada" aria-label="Lookbook">
      <div className="uni-container uni-lb-chamada-in">
        <div className="uni-lb-chamada-fotos" aria-hidden="true">
          {looks.slice(0, 5).map(({ cfg }) => (
            <img key={cfg.look} src={`/lookbook/look-${nn(cfg.look)}.webp`} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
        <div className="uni-lb-chamada-texto">
          <span className="uni-lb-sobre">Lookbook · {looks.length} looks</span>
          <h2 className="uni-lb-chamada-titulo">
            Uma bolsa para <em>cada momento.</em>
          </h2>
          <p>Veja como usar cada bolsa: festa, trabalho, viagem, academia, praia. E compre direto do look.</p>
        </div>
        <a
          href="#lookbook"
          className="uni-hero-buy"
          onClick={(e) => {
            const alvo = document.getElementById('lookbook');
            if (!alvo) return;
            e.preventDefault();
            // As fotos do catálogo carregam no caminho e empurram a página:
            // depois de rolar, acerta a posição mais uma vez.
            alvo.scrollIntoView({ behavior: 'smooth' });
            window.setTimeout(() => alvo.scrollIntoView({ behavior: 'smooth' }), 900);
            window.setTimeout(() => alvo.querySelector<HTMLElement>('.uni-lb-palco')?.focus({ preventScroll: true }), 1600);
          }}
        >
          Ver os looks
        </a>
      </div>
    </section>
  );
}

/**
 * O lookbook no celular: em vez da passarela (que precisa de tela larga),
 * um carrossel de cartões que desliza com o dedo, com o próximo look
 * aparecendo na borda. Cada cartão tem a modelo e, embaixo, a bolsa do
 * look com preço e "Comprar". As imagens só baixam quando chegam perto.
 */
export function LookbookCelular({ looks }: { looks: LookDaVitrine[] }) {
  const secao = useRef<HTMLElement>(null);
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [adicionado, setAdicionado] = useState<number | null>(null);
  // As fotos só baixam quando a seção chega perto (economiza o 4G de quem
  // não rola até aqui).
  const [perto, setPerto] = useState(false);

  useEffect(() => {
    const el = secao.current;
    if (!el || perto) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setPerto(true), { rootMargin: '500px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [perto]);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let frame = 0;
    const ler = () => {
      frame = 0;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const passo = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
      setAtual(clamp(Math.round(el.scrollLeft / passo), 0, looks.length - 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(ler);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [looks.length]);

  if (looks.length === 0) return null;
  const ir = (i: number) => {
    const el = trilho.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  };

  return (
    <section className="uni-lbm" id="looks" ref={secao} aria-label="Lookbook: uma bolsa para cada momento">
      <div className="uni-lbm-topo">
        <span className="uni-lb-sobre">Lookbook · {looks.length} looks</span>
        <h2 className="uni-lbm-titulo">
          Uma bolsa para <em>cada momento.</em>
        </h2>
        <p>Deslize para ver os looks. A bolsa de cada um entra no seu pedido com um toque.</p>
      </div>
      <div className="uni-lbm-trilho" ref={trilho}>
        {looks.map(({ cfg, product }) => {
          const preco = productPrice(product);
          const cor = product.colors.find((c) => c.name.toLowerCase() === (cfg.cor ?? '').toLowerCase()) ?? null;
          return (
            <article key={cfg.look} className="uni-lbm-card">
              <div className="uni-lbm-foto">
                <span className="uni-lbm-n">{nn(cfg.look)}</span>
                <span className="uni-lbm-tema">{cfg.tema}</span>
                {perto && <img src={`/lookbook/look-${nn(cfg.look)}.webp`} alt="" loading="lazy" decoding="async" draggable={false} />}
              </div>
              <div className="uni-lbm-bolsa">
                <Link href={`/produtos/${product.slug}`} className="uni-lbm-mini" aria-hidden="true" tabIndex={-1}>
                  {perto && <img src={`/lookbook/bolsa-${nn(cfg.look)}.webp`} alt="" loading="lazy" decoding="async" />}
                </Link>
                <div className="uni-lbm-info">
                  <Link href={`/produtos/${product.slug}`} className="uni-lbm-nome">
                    {product.name}
                  </Link>
                  <span className="uni-lbm-preco">
                    {preco.currentLabel} <small>no atacado</small>
                  </span>
                </div>
                <button
                  type="button"
                  className={'uni-lbm-comprar' + (adicionado === cfg.look ? ' is-feito' : '')}
                  onClick={() => {
                    adicionarAoPedido(itemDaPeca(product, cor, undefined, cfg.fotoPedido));
                    setAdicionado(cfg.look);
                  }}
                  aria-label={`Comprar ${product.name}`}
                >
                  <BagIcon size={14} />
                  {adicionado === cfg.look ? 'Adicionada' : 'Comprar'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="uni-lbm-pontos" role="tablist" aria-label="Escolher o look">
        {looks.map(({ cfg }, i) => (
          <button
            key={cfg.look}
            type="button"
            role="tab"
            aria-selected={i === atual}
            aria-label={`Look ${nn(cfg.look)}: ${cfg.tema}`}
            className={i === atual ? 'is-atual' : undefined}
            onClick={() => ir(i)}
          />
        ))}
      </div>
    </section>
  );
}
