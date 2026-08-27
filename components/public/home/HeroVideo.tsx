'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HeroSlide } from '@/lib/content/hero-slides';

/**
 * Slide de vídeo do hero.
 *
 * O arquivo é servido pelo próprio site, então começa junto com a página — sem
 * abrir conexão com outro domínio nem baixar player de terceiro antes. O
 * `poster` é o frame 0 do próprio vídeo: até o primeiro quadro existir é ele
 * que aparece, e como são a mesma imagem a entrada não tem troca visível — o
 * quadro apenas ganha movimento.
 */
export function HeroVideo({
  slide,
  priority,
  isActive,
}: {
  slide: HeroSlide;
  priority: boolean;
  isActive: boolean;
}) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // O vídeo vem no HTML do servidor e costuma já estar tocando quando o React
  // hidrata — e aí o `playing` não dispara mais. Confere o estado na montagem.
  useEffect(() => {
    const el = videoRef.current;
    if (el && !el.paused && el.readyState >= 3) setReady(true);
  }, []);

  // Voltando pro slide depois de uma volta do carrossel, cutuca o player: se o
  // navegador tiver suspendido a reprodução enquanto ele estava fora de cena,
  // isto religa em vez de deixar o quadro parado.
  useEffect(() => {
    if (!isActive) return;
    void videoRef.current?.play().catch(() => {});
  }, [isActive]);

  return (
    <div className="uni-carousel-video">
      <video
        ref={videoRef}
        className="uni-carousel-video-el"
        poster={slide.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={slide.alt}
        onPlaying={() => setReady(true)}
      >
        {/* O navegador desce a lista e para na primeira fonte que ele
            consegue tocar e cujo `media` bate — só essa é baixada. A ordem
            resolve duas escolhas de uma vez: resolução pela largura da tela
            (1080p no desktop, 720p no celular) e formato pelo suporte do
            navegador (WebM, menor, onde houver; MP4 no Safari). */}
        <source
          media="(min-width: 900px)"
          src={`${slide.video}-1080.webm`}
          type="video/webm"
        />
        <source
          media="(min-width: 900px)"
          src={`${slide.video}-1080.mp4`}
          type="video/mp4"
        />
        <source src={`${slide.video}-720.webm`} type="video/webm" />
        <source src={`${slide.video}-720.mp4`} type="video/mp4" />
      </video>
      {slide.poster && (
        <Image
          src={slide.poster}
          alt={slide.alt}
          fill
          sizes="100vw"
          priority={priority}
          className={'uni-carousel-poster' + (ready ? ' is-gone' : '')}
        />
      )}
    </div>
  );
}
