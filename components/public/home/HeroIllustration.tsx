/**
 * Editorial brand hero illustration ported from
 * `Claude Design - Reference/Uni Bolsas/js/images.js#brandHero`.
 * SVG composition: backdrop arch, model bust silhouette, bag held in hand,
 * editorial typography in corners.
 */
export function HeroIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className="uni-hero-img"
      aria-label="Composição editorial Uni Bolsas"
      role="img"
    >
      <rect width="400" height="500" fill="#E8DFCE" />
      <rect x="0" y="0" width="400" height="60" fill="#D7CDB8" />
      {/* backdrop arch */}
      <path
        d="M 60 500 L 60 230 Q 60 130 200 130 Q 340 130 340 230 L 340 500 Z"
        fill="#F4EFE6"
      />
      {/* model bust */}
      <ellipse cx="200" cy="200" rx="48" ry="55" fill="#5A4534" />
      <path
        d="M 145 252 Q 145 244 154 242 L 246 242 Q 255 244 255 252 L 270 420 Q 272 440 252 440 L 148 440 Q 128 440 130 420 Z"
        fill="#3A2E20"
      />
      {/* bag held */}
      <path
        d="M 268 295 Q 268 290 274 290 L 322 290 Q 328 290 328 295 L 326 360 Q 326 368 318 368 L 278 368 Q 270 368 270 360 Z"
        fill="#8B5A3C"
      />
      <path
        d="M 278 290 Q 282 268 298 268 Q 314 268 318 290"
        fill="none"
        stroke="#C9A55B"
        strokeWidth="2.5"
        strokeDasharray="3 4"
      />
      {/* editorial type */}
      <text
        x="32"
        y="44"
        fontFamily="Fraunces, serif"
        fontSize="14"
        fontStyle="italic"
        fill="#111"
        letterSpacing="-0.5"
      >
        Coleção · 2026
      </text>
      <text
        x="368"
        y="44"
        fontFamily="DM Sans, sans-serif"
        fontSize="9"
        letterSpacing="4"
        fill="#111"
        textAnchor="end"
        opacity="0.6"
      >
        UNI BOLSAS
      </text>
      <text
        x="32"
        y="478"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize="11"
        fill="#111"
        opacity="0.55"
      >
        elegância que acompanha seu ritmo
      </text>
    </svg>
  );
}
