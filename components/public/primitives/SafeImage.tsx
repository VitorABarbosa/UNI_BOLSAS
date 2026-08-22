'use client';

import Image, { type ImageProps } from 'next/image';
import { useState, type ReactNode } from 'react';

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  /** O que desenhar se o arquivo não existir (404) ou falhar ao carregar. */
  fallback?: ReactNode;
};

/**
 * `next/image` com degradação graciosa.
 *
 * Algumas artes (feed do Instagram, foto do manifesto) são publicadas
 * manualmente em `public/` e podem não estar lá — hoje o site mostra o ícone de
 * imagem quebrada nesses casos. Aqui a falha vira um bloco neutro no tom da
 * marca, que não denuncia o buraco.
 */
export function SafeImage({ fallback, alt, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="uni-img-fallback">{fallback}</span>;
  }

  return <Image {...props} alt={alt} onError={() => setFailed(true)} />;
}
