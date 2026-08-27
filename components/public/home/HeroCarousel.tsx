'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { HERO_SLIDES } from '@/lib/content/hero-slides';
import { HeroVideo } from '@/components/public/home/HeroVideo';

const ADVANCE_MS = 5000;
/** O vídeo ganha mais tempo de tela — 5s cortariam ele no meio da cena. */
const VIDEO_ADVANCE_MS = 12000;
const TRANSITION_MS = 900;
/** Distância mínima (px) do arrasto pra contar como troca de slide. */
const SWIPE_THRESHOLD = 45;

const isVideo = (s: (typeof HERO_SLIDES)[number]) => !!(s.vimeoId || s.video);

const advanceMsFor = (idx: number) => {
  const slide = HERO_SLIDES[idx];
  return slide && isVideo(slide) ? VIDEO_ADVANCE_MS : ADVANCE_MS;
};

/** O primeiro slide de FOTO é o candidato a LCP — o vídeo carrega à parte. */
const FIRST_IMAGE_IDX = HERO_SLIDES.findIndex((s) => s.image != null);

export function HeroCarousel() {
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
        if (!isActive && !isPrev && !slide.vimeoId && !slide.video) return null;
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
            {slide.vimeoId || slide.video ? (
              <HeroVideo
                slide={slide}
                priority={i === 0}
                isActive={isActive}
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
