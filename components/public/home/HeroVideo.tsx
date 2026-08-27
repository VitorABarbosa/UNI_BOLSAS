'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { HeroSlide } from '@/lib/content/hero-slides';

const VIMEO_ORIGIN = 'https://player.vimeo.com';

/**
 * O iframe já está no HTML do servidor, então ele costuma terminar de carregar
 * ANTES do React hidratar — e nesse caso o `onLoad` do React nunca dispara e o
 * `ready` do player é emitido antes de existir alguém escutando. Por isso a
 * inscrição é repetida por alguns segundos em vez de depender de um evento
 * único: postMessage pra um iframe que ainda não carregou simplesmente se
 * perde, então repetir não custa nada.
 */
const SUBSCRIBE_EVERY_MS = 300;
const SUBSCRIBE_ATTEMPTS = 20;

/**
 * Rede de segurança pro caso do player estar vivo mas não mandar `timeupdate`
 * (API mudou de contrato). Só é armada DEPOIS do `ready`, ou seja, depois de
 * ter prova de que o iframe carregou: se o Vimeo estiver fora do ar ou barrado
 * na rede do visitante, nada chega, o relógio nunca corre e a capa fica de vez
 * — que é o certo, porque revelar ali traria de volta o quadro preto.
 */
const REVEAL_FALLBACK_MS = 5000;

type VimeoMessage = {
  event?: string;
  data?: { seconds?: number };
};

/**
 * Slide de vídeo do hero.
 *
 * A capa (poster) aparece na primeira pintura da página e SÓ sai quando o
 * vídeo tem frame pra mostrar — antes disso o visitante encararia o quadro
 * preto do player carregando, que é justamente o problema que isto resolve.
 *
 * Com `slide.video` (MP4 no próprio site) o navegador avisa sozinho. Com
 * `slide.vimeoId` a conversa é por postMessage: a gente assina `timeupdate` e
 * espera o primeiro segundo passar — `play` dispara no comando, antes de
 * existir imagem, e revelar ali traria o preto de volta.
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Voltando pro slide depois de uma volta do carrossel, cutuca o player: se
  // o navegador tiver suspendido a reprodução enquanto ele estava fora de
  // cena, isto religa em vez de deixar o quadro parado.
  useEffect(() => {
    if (!isActive) return;
    if (slide.vimeoId) {
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: 'play' }),
        VIMEO_ORIGIN,
      );
    }
    void videoRef.current?.play().catch(() => {});
  }, [isActive, slide.vimeoId]);

  // ---- MP4 local: o elemento pode já estar tocando quando o React hidrata,
  // e aí o `playing` não dispara mais. Confere o estado atual na montagem.
  useEffect(() => {
    if (!slide.video) return;
    const el = videoRef.current;
    if (el && !el.paused && el.readyState >= 3) setReady(true);
  }, [slide.video]);

  // ---- Vimeo: escuta o player e insiste na inscrição até ele responder.
  useEffect(() => {
    if (!slide.vimeoId) return;

    let done = false;
    let attempts = 0;
    let fallback: ReturnType<typeof setTimeout> | null = null;

    const post = (value: string) =>
      frameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: 'addEventListener', value }),
        VIMEO_ORIGIN,
      );

    const subscribe = () => {
      post('timeupdate');
      post('error');
    };

    const finish = (reveal: boolean) => {
      if (done) return;
      done = true;
      clearInterval(retry);
      if (fallback) clearTimeout(fallback);
      if (reveal) setReady(true);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== VIMEO_ORIGIN) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      let msg: VimeoMessage;
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (msg?.event === 'ready') {
        // Prova de que o iframe carregou: só agora vale armar a rede de
        // segurança, e só uma vez (o player repete `ready` a cada loop).
        subscribe();
        if (!fallback) fallback = setTimeout(() => finish(true), REVEAL_FALLBACK_MS);
        return;
      }
      if (msg?.event === 'error') {
        finish(false);
        return;
      }
      if (msg?.event === 'timeupdate' && (msg.data?.seconds ?? 0) > 0) {
        finish(true);
      }
    };

    window.addEventListener('message', onMessage);
    const retry = setInterval(() => {
      subscribe();
      if (++attempts >= SUBSCRIBE_ATTEMPTS) clearInterval(retry);
    }, SUBSCRIBE_EVERY_MS);
    subscribe();

    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(retry);
      if (fallback) clearTimeout(fallback);
    };
  }, [slide.vimeoId]);

  return (
    <div className="uni-carousel-video">
      {slide.video ? (
        <video
          ref={videoRef}
          className="uni-carousel-video-el"
          src={slide.video}
          poster={slide.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={slide.alt}
          onPlaying={() => setReady(true)}
        />
      ) : (
        <iframe
          ref={frameRef}
          src={`${VIMEO_ORIGIN}/video/${slide.vimeoId}?background=1&autopause=0&muted=1&loop=1&dnt=1`}
          className="uni-carousel-video-iframe"
          title={slide.alt}
          allow="autoplay; fullscreen"
        />
      )}
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
