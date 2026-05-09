import { TOKENS } from '@/lib/tokens';

const QUADRAS: ReadonlyArray<readonly [number, number, number, number]> = [
  [200, 100, 80, 60],
  [310, 80, 110, 70],
  [440, 100, 90, 80],
  [580, 90, 80, 60],
  [180, 200, 70, 90],
  [280, 220, 100, 80],
  [410, 220, 80, 70],
  [510, 230, 90, 70],
  [640, 220, 80, 100],
  [70, 380, 100, 70],
  [200, 400, 90, 80],
  [330, 410, 100, 70],
  [460, 420, 80, 80],
  [580, 430, 100, 70],
  [720, 440, 80, 80],
  [120, 510, 100, 70],
  [260, 510, 80, 70],
  [400, 520, 100, 60],
  [540, 520, 80, 70],
];

export function MapIllustration() {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: TOKENS.boneLight,
      }}
      aria-label="Mapa ilustrado da região do Brás"
    >
      <defs>
        <pattern
          id="mapDots"
          x="0"
          y="0"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="0.7" fill={TOKENS.whisper} opacity="0.7" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill={TOKENS.boneLight} />
      <rect width="800" height="600" fill="url(#mapDots)" />
      {/* Rio Tamanduateí */}
      <path
        d="M-20,80 Q140,150 220,200 T420,280 T620,360 T820,420"
        fill="none"
        stroke={TOKENS.sage}
        strokeOpacity="0.35"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M-20,80 Q140,150 220,200 T420,280 T620,360 T820,420"
        fill="none"
        stroke={TOKENS.bone}
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      {/* Avenidas principais */}
      <path
        d="M0,360 Q220,340 400,310 T800,260"
        fill="none"
        stroke={TOKENS.whisper}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M0,360 Q220,340 400,310 T800,260"
        fill="none"
        stroke={TOKENS.bone}
        strokeWidth="1"
        strokeDasharray="3 6"
      />
      <path
        d="M120,0 L240,600"
        stroke={TOKENS.whisper}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M120,0 L240,600"
        stroke={TOKENS.bone}
        strokeWidth="1"
        strokeDasharray="3 6"
      />
      <path
        d="M520,0 L600,600"
        stroke={TOKENS.whisper}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M520,0 L600,600"
        stroke={TOKENS.bone}
        strokeWidth="1"
        strokeDasharray="3 6"
      />
      {/* Trilhos CPTM */}
      <path
        d="M-20,460 L820,360"
        stroke={TOKENS.charcoal}
        strokeWidth="3"
        strokeOpacity="0.5"
      />
      <path
        d="M-20,470 L820,370"
        stroke={TOKENS.charcoal}
        strokeWidth="3"
        strokeOpacity="0.5"
        strokeDasharray="14 8"
      />
      {/* Quadras */}
      {QUADRAS.map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          rx="2"
          fill={i % 4 === 0 ? TOKENS.whisper : TOKENS.bone}
          stroke={TOKENS.whisper}
          strokeWidth="1"
          opacity={i % 5 === 0 ? 0.85 : 1}
        />
      ))}
      {/* Estação Brás */}
      <circle
        cx="180"
        cy="445"
        r="14"
        fill={TOKENS.pearl}
        stroke={TOKENS.charcoal}
        strokeWidth="2"
      />
      <text
        x="180"
        y="450"
        textAnchor="middle"
        fontSize="13"
        fontFamily="'DM Sans', sans-serif"
        fontWeight="700"
        fill={TOKENS.charcoal}
      >
        B
      </text>
      <text
        x="180"
        y="476"
        textAnchor="middle"
        fontSize="11"
        fontFamily="'DM Sans', sans-serif"
        letterSpacing="0.16em"
        fill={TOKENS.charcoal}
      >
        BRÁS
      </text>
      {/* Pin Shopping 900 */}
      <g transform="translate(420, 240)">
        <circle r="42" fill={TOKENS.ink} opacity="0.08" />
        <circle r="28" fill={TOKENS.bone} stroke={TOKENS.ink} strokeWidth="2" />
        <path
          d="M-1.5,-22 L1.5,-22 Q9,-22 9,-12 L9,4 Q9,12 1.5,12 L-1.5,12 Q-9,12 -9,4 L-9,-12 Q-9,-22 -1.5,-22 Z M-9,-2 L9,-2"
          stroke={TOKENS.ink}
          strokeWidth="1.6"
          fill="none"
        />
        <circle cx="9" cy="-12" r="2" fill={TOKENS.caramel} />
      </g>
      <g transform="translate(420, 165)">
        <rect x="-66" y="-18" width="132" height="36" fill={TOKENS.ink} rx="0" />
        <text
          x="0"
          y="-2"
          textAnchor="middle"
          fontFamily="'DM Sans', sans-serif"
          fontSize="9"
          letterSpacing="0.32em"
          fill={TOKENS.whisper}
        >
          VOCÊ ESTÁ AQUI
        </text>
        <text
          x="0"
          y="13"
          textAnchor="middle"
          fontFamily="'Fraunces', serif"
          fontStyle="italic"
          fontSize="14"
          fill={TOKENS.bone}
        >
          Shopping 900
        </text>
        <path d="M-6,18 L0,28 L6,18 Z" fill={TOKENS.ink} />
      </g>
      {/* Compass */}
      <g transform="translate(740, 60)">
        <circle r="22" fill={TOKENS.bone} stroke={TOKENS.whisper} strokeWidth="1" />
        <path d="M0,-14 L4,0 L0,14 L-4,0 Z" fill={TOKENS.ink} />
        <text
          x="0"
          y="-26"
          textAnchor="middle"
          fontFamily="'DM Mono', monospace"
          fontSize="10"
          fill={TOKENS.charcoal}
        >
          N
        </text>
      </g>
      {/* Scale */}
      <g transform="translate(60, 555)">
        <rect width="90" height="3" fill={TOKENS.charcoal} />
        <rect
          x="45"
          width="45"
          height="3"
          fill={TOKENS.bone}
          stroke={TOKENS.charcoal}
          strokeWidth="1"
        />
        <text
          x="45"
          y="-6"
          textAnchor="middle"
          fontFamily="'DM Mono', monospace"
          fontSize="10"
          letterSpacing="0.06em"
          fill={TOKENS.charcoal}
        >
          200m
        </text>
      </g>
      {/* Labels */}
      <text
        x="44"
        y="370"
        fontFamily="'DM Mono', monospace"
        fontSize="10"
        letterSpacing="0.18em"
        fill={TOKENS.stone}
        transform="rotate(-2 44 370)"
      >
        AV. RANGEL PESTANA
      </text>
      <text
        x="566"
        y="160"
        fontFamily="'DM Mono', monospace"
        fontSize="10"
        letterSpacing="0.18em"
        fill={TOKENS.stone}
        transform="rotate(78 566 160)"
      >
        R. MARIA MARCOLINA
      </text>
    </svg>
  );
}
