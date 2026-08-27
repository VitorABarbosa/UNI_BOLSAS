'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { preconnect, prefetchDNS } from 'react-dom';
import { HERO_SLIDES } from '@/lib/content/hero-slides';

const ADVANCE_MS = 5000;
/** O vídeo ganha mais tempo de tela — 5s cortariam ele no meio da cena. */
const VIDEO_ADVANCE_MS = 12000;
const TRANSITION_MS = 900;
/** Distância mínima (px) do arrasto pra contar como troca de slide. */
const SWIPE_THRESHOLD = 45;

const advanceMsFor = (idx: number) =>
  HERO_SLIDES[idx]?.vimeoId ? VIDEO_ADVANCE_MS : ADVANCE_MS;

/** O primeiro slide de FOTO é o candidato a LCP — o vídeo carrega à parte. */
const FIRST_IMAGE_IDX = HERO_SLIDES.findIndex((s) => s.image != null);

export function HeroCarousel({
  videoPosters,
}: {
  /**
   * Poster por `key` de slide de vídeo (frame do filme, resolvido no
   * servidor — ver lib/vimeo.ts). Cobre o quadro no lugar do player até o
   * vídeo estar de fato tocando; sem ele o slide abre num quadro vazio
   * enquanto o player do Vimeo baixa e inicializa.
   */
  videoPosters?: Record<string, string>;
}) {
  // O player, os assets e o poster do Vimeo vêm de domínios próprios; abrir
  // as conexões junto com o HTML corta DNS+TLS do caminho crítico do vídeo.
  if (HERO_SLIDES.some((s) => s.vimeoId != null)) {
    preconnect('https://player.vimeo.com');
    preconnect('https://f.vimeocdn.com');
    preconnect('https://i.vimeocdn.com');
    prefetchDNS('https://vod-adaptive-ak.vimeocdn.com');
  }

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback(
    (idx: number, direction: 1 | -1) => {
      if (transitioning || idx === active) return;
      setDir(direction);
      setPrev(active);
      setActive(idx);
      setTransitioning(true);
      setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, TRANSITION_MS);
    },
    [active, transitioning],
  );

  const next = useCallback(
    () => goTo((active + 1) % HERO_SLIDES.length, 1),
    [active, goTo],
  );
  const prevSlide = useCallback(
    () => goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1),
    [active, goTo],
  );
  const goIdx = (i: number) => goTo(i, i > active ? 1 : -1);

  // setTimeout (e não setInterval): cada slide tem seu próprio tempo de
  // exibição — o vídeo fica mais que as fotos. O efeito re-arma a cada troca
  // porque `next` muda junto com `active`.
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, advanceMsFor(active));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [next, active, paused]);

  // Não gasta bateria nem "pula" slides enquanto a aba está em segundo plano.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const resetTimer = (fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    fn();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Só conta como swipe se for claramente horizontal — senão é scroll.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    resetTimer(dx < 0 ? next : prevSlide);
  };

  return (
    <div
      className="uni-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques Uni Bolsas"
      style={
        { ['--advance' as string]: `${advanceMsFor(active)}ms` } as CSSProperties
      }
    >
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        const isPrev = i === prev;
        // Slides de vídeo ficam SEMPRE montados: desmontar o iframe faria o
        // player do Vimeo recarregar do zero a cada volta do carrossel.
        if (!isActive && !isPrev && !slide.vimeoId) return null;
        return (
          <div
            key={slide.key}
            className={[
              'uni-carousel-slide',
              isActive ? 'is-active' : '',
              isPrev ? 'is-prev' : '',
              !isActive && !isPrev ? 'is-idle' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ ['--slide-dir' as string]: dir } as CSSProperties}
            data-dir={dir}
          >
            {slide.vimeoId ? (
              <VimeoBackground
                vimeoId={slide.vimeoId}
                title={slide.alt}
                poster={videoPosters?.[slide.key]}
              />
            ) : (
              <Image
                src={slide.image ?? ''}
                alt={slide.alt}
                className="uni-carousel-img"
                fill
                // Full-bleed em qualquer largura — o Next serve a variante certa.
                sizes="100vw"
                // A primeira FOTO é candidata a LCP: sem lazy, entra no preload.
                priority={i === FIRST_IMAGE_IDX}
              />
            )}
            <div className="uni-carousel-overlay" />
            <div className="uni-carousel-tag">{slide.tag}</div>
          </div>
        );
      })}

      <div className="uni-carousel-dots">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            className={'uni-carousel-dot' + (i === active ? ' is-active' : '')}
            onClick={() => resetTimer(() => goIdx(i))}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === active}
            type="button"
          >
            <span key={active} className="uni-carousel-dot-fill" />
          </button>
        ))}
      </div>

      <button
        className="uni-carousel-arrow uni-carousel-arrow-prev"
        onClick={() => resetTimer(prevSlide)}
        aria-label="Slide anterior"
        type="button"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className="uni-carousel-arrow uni-carousel-arrow-next"
        onClick={() => resetTimer(next)}
        aria-label="Próximo slide"
        type="button"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="uni-carousel-progress">
        <div key={active} className="uni-carousel-progress-fill" />
      </div>
    </div>
  );
}

const VIMEO_PLAYER_ORIGIN = 'https://player.vimeo.com';
/** Cadência da sondagem `getPaused` enquanto o vídeo ainda não confirmou. */
const VIMEO_PROBE_MS = 700;
/** Depois disso pára de sondar — o listener continua, o poster continua. */
const VIMEO_PROBE_GIVE_UP_MS = 20000;

/**
 * Player do Vimeo em modo background com um poster por cima.
 *
 * O poster (frame do filme, já no HTML inicial com prioridade de LCP) segura
 * o quadro enquanto o player baixa e inicializa. Ele só sai de cena quando o
 * vídeo está COMPROVADAMENTE tocando, via API postMessage do player: o
 * componente registra os eventos `play`/`playing` e, por garantia, sonda
 * `getPaused` — cobre o caso do autoplay disparar antes do registro chegar.
 * Se o player nunca responder (bloqueado, sem rede), o poster simplesmente
 * fica: o hero continua "pronto", só sem movimento.
 */
function VimeoBackground({
  vimeoId,
  title,
  poster,
}: {
  vimeoId: string;
  title: string;
  poster?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Sem poster não há o que revelar; com `live` o trabalho já acabou.
    if (live || !poster) return;
    const frame = iframeRef.current;
    if (!frame) return;

    const post = (payload: Record<string, unknown>) =>
      frame.contentWindow?.postMessage(
        JSON.stringify(payload),
        VIMEO_PLAYER_ORIGIN,
      );

    const onMessage = (e: MessageEvent) => {
      if (
        e.origin !== VIMEO_PLAYER_ORIGIN ||
        e.source !== frame.contentWindow
      )
        return;
      let data: unknown = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (typeof data !== 'object' || data === null) return;
      const msg = data as { event?: string; method?: string; value?: unknown };
      if (msg.event === 'ready') {
        post({ method: 'addEventListener', value: 'play' });
        post({ method: 'addEventListener', value: 'playing' });
      }
      if (
        msg.event === 'play' ||
        msg.event === 'playing' ||
        (msg.method === 'getPaused' && msg.value === false)
      ) {
        setLive(true);
      }
    };

    window.addEventListener('message', onMessage);
    const probe = setInterval(() => post({ method: 'getPaused' }), VIMEO_PROBE_MS);
    const giveUp = setTimeout(() => clearInterval(probe), VIMEO_PROBE_GIVE_UP_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(probe);
      clearTimeout(giveUp);
    };
  }, [live, poster]);

  return (
    <div className={'uni-carousel-video' + (live ? ' is-live' : '')}>
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?background=1&autopause=0&muted=1&loop=1&dnt=1`}
        className="uni-carousel-video-iframe"
        title={title}
        allow="autoplay; fullscreen"
      />
      {poster ? (
        <Image
          src={poster}
          // O iframe ao lado já descreve o conteúdo; o poster é decorativo.
          alt=""
          aria-hidden
          className="uni-carousel-video-poster"
          fill
          sizes="100vw"
          priority
        />
      ) : null}
    </div>
  );
}
