'use client';

import Image from 'next/image';

type ProductPhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  /** Aplicado só na foto de cima (o parallax do card, por exemplo). */
  style?: React.CSSProperties;
  /** Passa direto pro `next/image` de cima. */
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Foto de produto que nunca corta a peça.
 *
 * As fotos de anúncio chegam em proporções variadas e o recorte quadrado
 * decepava a bolsa. Aqui a foto entra inteira (`object-fit: contain`) e o
 * espaço que sobra é preenchido por uma cópia desfocada dela mesma — em vez
 * de uma faixa vazia. Foto já quadrada preenche o quadro e o fundo nem
 * aparece.
 *
 * As duas camadas usam a mesma URL, então o navegador baixa um arquivo só.
 */
/**
 * Qualidade das fotos de produto. Acima do padrão (75) porque aqui a textura
 * do material é argumento de venda — precisa estar declarada em
 * `images.qualities` no next.config, senão o otimizador responde 400.
 */
const PHOTO_QUALITY = 90;

export function ProductPhoto({
  src,
  alt,
  sizes,
  className,
  priority,
  loading,
  style,
  fetchPriority,
}: ProductPhotoProps) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        className="uni-photo-backdrop"
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        fetchPriority={fetchPriority}
        quality={PHOTO_QUALITY}
      />
      <Image
        src={src}
        alt={alt}
        className={['uni-photo', className].filter(Boolean).join(' ')}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        fetchPriority={fetchPriority}
        quality={PHOTO_QUALITY}
        style={style}
      />
    </>
  );
}
