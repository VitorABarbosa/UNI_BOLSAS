/**
 * Six editorial SVG compositions used by the Social/IG mosaic.
 * Ported from `Claude Design - Reference/Uni Bolsas/js/images.js#igPost`.
 */

type Props = { className?: string };

function Wrap({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export function IgPost1({ className }: Props) {
  return (
    <Wrap className={className} label="Bolsa em foco">
      <rect width="400" height="400" fill="#D8C9AD" />
      <path d="M 130 150 L 270 150 L 280 320 L 120 320 Z" fill="#5C1A2B" />
      <path
        d="M 150 150 Q 155 110 200 110 Q 245 110 250 150"
        fill="none"
        stroke="#5C1A2B"
        strokeWidth="5"
      />
    </Wrap>
  );
}

export function IgPost2({ className }: Props) {
  return (
    <Wrap className={className} label="Lifestyle Brás">
      <rect width="400" height="400" fill="#3A2E20" />
      <ellipse cx="200" cy="160" rx="42" ry="48" fill="#C9A98C" />
      <path d="M 140 230 L 260 230 L 270 380 L 130 380 Z" fill="#F4EFE6" />
      <rect x="240" y="280" width="50" height="60" fill="#8B5A3C" />
    </Wrap>
  );
}

export function IgPost3({ className }: Props) {
  return (
    <Wrap className={className} label="Mini bolsa">
      <rect width="400" height="400" fill="#E8DFCE" />
      <rect
        x="80"
        y="80"
        width="240"
        height="240"
        fill="#F4EFE6"
        stroke="#8B5A3C"
        strokeWidth="1.5"
      />
      <path
        d="M 150 200 L 250 200 L 256 290 Q 256 300 246 300 L 154 300 Q 144 300 144 290 Z"
        fill="#0F0F0F"
      />
      <rect x="190" y="240" width="20" height="14" rx="2" fill="#C9A55B" />
    </Wrap>
  );
}

export function IgPost4({ className }: Props) {
  return (
    <Wrap className={className} label="Mochila marinho">
      <rect width="400" height="400" fill="#C9B393" />
      <path
        d="M 100 180 Q 100 155 125 155 L 275 155 Q 300 155 300 180 L 295 280 Q 295 300 275 300 L 125 300 Q 105 300 105 280 Z"
        fill="#1A2B4A"
      />
      <line
        x1="115"
        y1="195"
        x2="285"
        y2="195"
        stroke="#C9A55B"
        strokeWidth="2"
      />
    </Wrap>
  );
}

export function IgPost5({ className }: Props) {
  return (
    <Wrap className={className} label="Olha essa">
      <rect width="400" height="400" fill="#5A4534" />
      <rect x="40" y="40" width="320" height="320" fill="#F4EFE6" opacity="0.92" />
      <text
        x="200"
        y="180"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="60"
        fill="#5C1A2B"
        textAnchor="middle"
      >
        olha
      </text>
      <text
        x="200"
        y="240"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="60"
        fill="#5C1A2B"
        textAnchor="middle"
      >
        essa
      </text>
    </Wrap>
  );
}

export function IgPost6({ className }: Props) {
  return (
    <Wrap className={className} label="Novidade caramelo">
      <rect width="400" height="400" fill="#D7CDB8" />
      <path d="M 130 175 L 270 175 L 280 330 L 120 330 Z" fill="#A47551" />
      <path
        d="M 150 175 Q 158 120 200 120 Q 242 120 250 175"
        fill="none"
        stroke="#A47551"
        strokeWidth="6"
      />
      <text
        x="40"
        y="40"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="14"
        fill="#111"
      >
        novidade
      </text>
    </Wrap>
  );
}

export const IG_POSTS = [
  IgPost1,
  IgPost2,
  IgPost3,
  IgPost4,
  IgPost5,
  IgPost6,
] as const;
