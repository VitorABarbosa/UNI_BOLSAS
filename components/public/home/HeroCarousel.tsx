'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { HERO_SLIDES } from '@/lib/content/hero-slides';

const ADVANCE_MS = 5000;
const TRANSITION_MS = 900;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number, direction: 1 | -1) => {
    if (transitioning || idx === active) return;
    setDir(direction);
    setPrev(active);
    setActive(idx);
    setTransitioning(true);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, TRANSITION_MS);
  };

  const next = () => goTo((active + 1) % HERO_SLIDES.length, 1);
  const prevSlide = () =>
    goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1);
  const goIdx = (i: number) => goTo(i, i > active ? 1 : -1);

  useEffect(() => {
    timerRef.current = setInterval(next, ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, transitioning]);

  const resetTimer = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fn();
  };

  return (
    <div className="uni-carousel">
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        const isPrev = i === prev;
        if (!isActive && !isPrev) return null;
        return (
          <div
            key={slide.key}
            className={[
              'uni-carousel-slide',
              isActive ? 'is-active' : '',
              isPrev ? 'is-prev' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ ['--slide-dir' as string]: dir } as CSSProperties}
            data-dir={dir}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="uni-carousel-img"
            />
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
