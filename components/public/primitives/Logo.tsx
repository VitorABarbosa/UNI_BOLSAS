import { TOKENS } from '@/lib/tokens';

type LogoProps = {
  size?: number;
  color?: string;
  italic?: boolean;
};

export function Logo({ size = 22, color, italic = true }: LogoProps) {
  return (
    <a
      href="#top"
      style={{
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        color: color ?? TOKENS.ink,
      }}
    >
      <img
        src="/LOGO_UNI_BOLSAS_PNG.png"
        alt=""
        aria-hidden="true"
        style={{
          height: size * 1.8,
          width: 'auto',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: size,
            fontWeight: 400,
            letterSpacing: '-0.025em',
            fontStyle: italic ? 'italic' : 'normal',
          }}
        >
          Uni Bolsas
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: size * 0.5,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: TOKENS.leatherDark,
            opacity: 0.78,
          }}
        >
          · Brás
        </span>
      </span>
    </a>
  );
}
