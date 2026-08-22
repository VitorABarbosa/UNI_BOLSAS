import Image from 'next/image';
import { TOKENS } from '@/lib/tokens';

type LogoProps = {
  size?: number;
  color?: string;
  italic?: boolean;
};

export function Logo({ size = 22, color, italic = true }: LogoProps) {
  const mark = Math.round(size * 1.8);
  return (
    <a
      href="#top"
      className="uni-logo"
      aria-label="Uni Bolsas — início"
      style={{ color: color ?? TOKENS.ink }}
    >
      <Image
        src="/LOGO_UNI_BOLSAS_PNG.png"
        alt=""
        aria-hidden="true"
        width={mark}
        height={mark}
        priority
        className="uni-logo-mark"
      />
      <span className="uni-logo-text">
        <span
          className="uni-logo-name"
          style={{
            fontSize: size,
            fontStyle: italic ? 'italic' : 'normal',
          }}
        >
          Uni Bolsas
        </span>
        <span className="uni-logo-city" style={{ fontSize: size * 0.5 }}>
          · Brás
        </span>
      </span>
    </a>
  );
}
