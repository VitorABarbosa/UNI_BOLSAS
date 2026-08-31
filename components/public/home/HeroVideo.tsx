'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HeroSlide } from '@/lib/content/hero-slides';

/** A partir daqui o vídeo entra já no HTML; abaixo, só depois da página pronta. */
const DESKTOP = '(min-width: 900px)';

/**
 * Slide de vídeo do hero.
 *
 * A capa é o frame 0 do próprio vídeo e cobre o quadro desde a primeira
 * pintura. Como capa e primeiro quadro são a mesma imagem, a entrada do vídeo
 * não tem troca visível — o quadro apenas ganha movimento. E se o vídeo nunca
 * tocar (autoplay recusado, rede ruim), a capa fica: o hero vira um slide de
 * foto normal, nunca um quadro preto ou um botão de play solto.
 *
 * No CELULAR o vídeo só começa a baixar depois que a página termina de
 * carregar. No desktop sobra banda pra tudo ao mesmo tempo, mas no celular o
 * vídeo disputava com as fotos do catálogo e com o JavaScript — e o resultado
 * era todo mundo devagar. Adiar não atrasa o hero: a capa já está lá.
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
  // No desktop as fontes já saem no HTML do servidor. No celular elas entram
  // depois — por isso o estado começa `false` e só o efeito abaixo o liga.
  const [mobileArmed, setMobileArmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // O vídeo vem no HTML do servidor e costuma já estar tocando quando o React
  // hidrata — e aí o `playing` não dispara mais. Confere o estado na montagem.
  useEffect(() => {
    const el = videoRef.current;
    if (el && !el.paused && el.readyState >= 3) setReady(true);
  }, []);

  // Celular: espera a página terminar de carregar antes de pedir o vídeo.
  useEffect(() => {
    if (window.matchMedia(DESKTOP).matches) return;

    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      // Uma folga depois do `load` pra não competir com o que a página ainda
      // esteja buscando no rastro dele (fotos abaixo da dobra, fontes).
      timer = setTimeout(() => setMobileArmed(true), 600);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', arm);
    };
  }, []);

  // Fonte adicionada depois da montagem só é enxergada com um `load()`.
  useEffect(() => {
    if (!mobileArmed) return;
    const el = videoRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {});
  }, [mobileArmed]);

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
        // Sem `poster=` de propósito: quem cobre o quadro é o <Image> abaixo,
        // que passa pelo otimizador (34 KB em vez dos 179 KB do arquivo cru) e
        // fica por cima até o vídeo ter frame. Declarar os dois fazia a mesma
        // capa ser baixada duas vezes, competindo com o vídeo pela banda.
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={slide.alt}
        onPlaying={() => setReady(true)}
      >
        {/* O navegador desce a lista e para na primeira fonte que ele consegue
            tocar e cujo `media` bate — só essa é baixada. A ordem resolve duas
            escolhas de uma vez: resolução pela largura da tela e formato pelo
            suporte do navegador (WebM, menor, onde houver; MP4 no Safari). */}
        <source
          media={DESKTOP}
          src={`${slide.video}-1080.webm`}
          type="video/webm"
        />
        <source
          media={DESKTOP}
          src={`${slide.video}-1080.mp4`}
          type="video/mp4"
        />
        {/* Ausentes até a página carregar: sem fonte que sirva, o celular não
            baixa nada — e o que ele vê nesse meio-tempo é a capa. */}
        {mobileArmed && (
          <>
            <source src={`${slide.video}-720.webm`} type="video/webm" />
            <source src={`${slide.video}-720.mp4`} type="video/mp4" />
          </>
        )}
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
