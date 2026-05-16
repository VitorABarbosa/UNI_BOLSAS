/**
 * Three editorial SVG compositions used by the Manifesto carousel.
 * Ported from `Claude Design - Reference/Uni Bolsas/js/images.js#atelier`.
 */

type Props = { className?: string };

function Frame({
  bg,
  accent,
  label,
  children,
  className,
}: {
  bg: string;
  accent: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Atelier — ${label}`}
    >
      <rect width="400" height="400" fill={bg} />
      <rect x="40" y="60" width="320" height="260" fill={accent} opacity="0.18" />
      {children}
      <text
        x="32"
        y="380"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="11"
        fill="#111"
        opacity="0.4"
      >
        {label}
      </text>
    </svg>
  );
}

export function AtelierBags({ className }: Props) {
  const accent = '#8B5A3C';
  return (
    <Frame bg="#D8C9AD" accent={accent} label="Atelier" className={className}>
      <line x1="60" y1="100" x2="340" y2="100" stroke="#3A2E20" strokeWidth="3" />
      <g fill={accent}>
        <path d="M 90 110 L 140 110 L 145 200 Q 145 210 135 210 L 95 210 Q 85 210 85 200 Z" />
        <path
          d="M 165 110 L 215 110 L 220 200 Q 220 210 210 210 L 170 210 Q 160 210 160 200 Z"
          opacity="0.85"
        />
        <path
          d="M 240 110 L 290 110 L 295 200 Q 295 210 285 210 L 245 210 Q 235 210 235 200 Z"
          opacity="0.7"
        />
      </g>
    </Frame>
  );
}

export function AtelierCuradoria({ className }: Props) {
  const accent = '#6B4326';
  return (
    <Frame bg="#C9B393" accent={accent} label="Curadoria" className={className}>
      <rect x="40" y="240" width="320" height="100" fill="#3A2E20" opacity="0.5" />
      <ellipse cx="200" cy="180" rx="38" ry="42" fill="#5A4534" />
      <path d="M 150 230 L 250 230 L 260 320 L 140 320 Z" fill="#3A2E20" />
      <rect x="170" y="270" width="60" height="40" fill={accent} />
    </Frame>
  );
}

export function AtelierLoja({ className }: Props) {
  const accent = '#5C1A2B';
  return (
    <Frame bg="#E8DFCE" accent={accent} label="Loja" className={className}>
      <rect
        x="80"
        y="80"
        width="240"
        height="240"
        fill="#F4EFE6"
        stroke={accent}
        strokeWidth="2"
      />
      <rect x="100" y="100" width="100" height="200" fill={accent} opacity="0.2" />
      <rect x="220" y="100" width="100" height="200" fill={accent} opacity="0.2" />
      <text
        x="200"
        y="60"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="22"
        fill="#111"
        textAnchor="middle"
      >
        uni bolsas
      </text>
      <text
        x="200"
        y="350"
        fontFamily="DM Sans, sans-serif"
        fontSize="9"
        letterSpacing="4"
        fill="#111"
        textAnchor="middle"
        opacity="0.6"
      >
        SHOPPING 900 · BRÁS
      </text>
    </Frame>
  );
}

function makePhoto(src: string, alt: string) {
  return function ManifestoRealPhoto({ className }: { className?: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  };
}

export const MANIFESTO_PHOTOS = [
  makePhoto('/manifesto/campanha-1.jpg', 'Uni Bolsas — Campanha'),
  AtelierBags,
  AtelierCuradoria,
  AtelierLoja,
] as const;
