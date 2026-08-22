'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  threshold?: number;
};

/**
 * Anima a entrada do bloco quando ele aparece na viewport.
 *
 * O estado inicial (escondido) vive no CSS sob `.js-ready .uni-reveal`, e não
 * num style inline. Assim o HTML renderizado no servidor nasce visível: se o JS
 * demorar (celular no 4G) ou falhar, o conteúdo aparece do mesmo jeito, em vez
 * de a página ficar em branco até a hidratação.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  style = {},
  threshold = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [shown, threshold]);

  return (
    <Tag
      ref={ref}
      className={['uni-reveal', shown ? 'is-shown' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ ['--reveal-delay' as string]: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}
