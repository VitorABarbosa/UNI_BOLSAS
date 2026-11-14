'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/public/icons';
import type { GalleryImage } from '@/lib/product-images';
import { publicImageUrl } from '@/lib/supabase/image-url';

/** Quanto a foto aumenta no toque/clique. */
const ZOOM = 2.5;

type Pan = { x: number; y: number };

/**
 * Foto em tela cheia, com zoom.
 *
 * No atacado a pessoa compra sem pegar na peça: o que decide é ver a
 * textura, a costura, a ferragem. Aqui a foto abre no arquivo ORIGINAL —
 * não a versão reduzida da página — e um toque (ou clique) aproxima no ponto
 * tocado; arrastar passeia pela foto ampliada. O gesto de pinça do celular
 * também funciona, porque nada aqui o bloqueia enquanto a foto não está
 * ampliada.
 */
export function GalleryLightbox({
  images,
  startIdx,
  onClose,
}: {
  images: GalleryImage[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const arraste = useRef<{ x: number; y: number; pan: Pan; moveu: boolean } | null>(null);
  const toqueInicio = useRef<{ x: number; y: number } | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const total = images.length;
  const ir = useCallback(
    (delta: number) => {
      setZoomed(false);
      setPan({ x: 0, y: 0 });
      setIdx((i) => (i + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const voltar = document.activeElement as HTMLElement | null;
    painelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && total > 1) ir(1);
      else if (e.key === 'ArrowLeft' && total > 1) ir(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', onKey);
      voltar?.focus?.();
    };
  }, [onClose, ir, total]);

  /** Liga/desliga o zoom, centrando no ponto tocado. */
  const alternarZoom = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomed) {
      setZoomed(false);
      setPan({ x: 0, y: 0 });
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    // Distância do toque até o centro: depois do zoom, aquele ponto deve
    // ficar onde o dedo estava.
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setPan(limitar({ x: -dx * (ZOOM - 1), y: -dy * (ZOOM - 1) }, r, imgRef.current));
    setZoomed(true);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomed) {
      e.currentTarget.setPointerCapture(e.pointerId);
      arraste.current = { x: e.clientX, y: e.clientY, pan, moveu: false };
    } else {
      toqueInicio.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arraste.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) a.moveu = true;
    setPan(
      limitar(
        { x: a.pan.x + dx, y: a.pan.y + dy },
        e.currentTarget.getBoundingClientRect(),
        imgRef.current,
      ),
    );
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = arraste.current;
    arraste.current = null;
    if (a) {
      // Ampliada: soltar sem arrastar volta ao normal; arrastar só passeia.
      if (!a.moveu) alternarZoom(e);
      return;
    }
    const t = toqueInicio.current;
    toqueInicio.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    // Sem zoom, um arraste lateral troca de foto; um toque parado amplia.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && total > 1) {
      ir(dx < 0 ? 1 : -1);
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      alternarZoom(e);
    }
  };

  const img = images[idx];
  if (!img) return null;

  return (
    <div
      className="uni-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      tabIndex={-1}
      ref={painelRef}
    >
      <div className="uni-lightbox-bar">
        <span className="uni-lightbox-count" aria-live="polite">
          {total > 1 ? `${idx + 1} / ${total}` : ''}
        </span>
        <span className="uni-lightbox-dica">
          {zoomed ? 'Arraste pra ver a foto · toque pra voltar' : 'Toque na foto pra aproximar'}
        </span>
        <button
          type="button"
          className="uni-lightbox-btn"
          onClick={onClose}
          aria-label="Fechar foto"
        >
          <CloseIcon size={20} />
        </button>
      </div>
      <div
        className={'uni-lightbox-stage' + (zoomed ? ' is-zoomed' : '')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          arraste.current = null;
          toqueInicio.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- o original,
            sem passar pelo otimizador: é o arquivo inteiro que mostra o detalhe */}
        <img
          key={img.storage_path}
          ref={imgRef}
          src={publicImageUrl(img.storage_path)}
          alt={img.alt}
          draggable={false}
          style={{
            transform: zoomed
              ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${ZOOM})`
              : undefined,
          }}
        />
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            className="uni-lightbox-btn uni-lightbox-prev"
            onClick={() => ir(-1)}
            aria-label="Foto anterior"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            type="button"
            className="uni-lightbox-btn uni-lightbox-next"
            onClick={() => ir(1)}
            aria-label="Próxima foto"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Não deixa a foto ampliada descolar da borda: o deslocamento máximo, pra
 * cada lado, é o quanto a FOTO ampliada passa do palco. Medir o palco no
 * lugar da foto deixava uma foto deitada, numa tela em pé, ser arrastada até
 * sobrar uma faixa vazia em cima ou embaixo.
 */
function limitar(p: Pan, palco: DOMRect, img: HTMLImageElement | null): Pan {
  // offsetWidth/Height é o tamanho de layout, sem o `scale` aplicado.
  const w = img?.offsetWidth || palco.width;
  const h = img?.offsetHeight || palco.height;
  const maxX = Math.max(0, (w * ZOOM - palco.width) / 2);
  const maxY = Math.max(0, (h * ZOOM - palco.height) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, p.x)),
    y: Math.max(-maxY, Math.min(maxY, p.y)),
  };
}
