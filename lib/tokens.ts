/**
 * Single source of truth for the Uni Bolsas brand palette and contact constants.
 * Mirrors the CSS variables defined in `app/globals.css`. When changing a value
 * here, update the matching `--color-*` var (and vice-versa).
 */

export const TOKENS = {
  bone: '#F4EFE6',
  boneLight: '#FAF7F1',
  ink: '#111111',
  charcoal: '#2A2724',
  stone: '#6E665C',
  whisper: '#E5DECF',
  pearl: '#FFFFFF',
  leather: '#8B5A3C',
  leatherDark: '#6B4326',
  caramel: '#C9934A',
  wine: '#5C1A2B',
  sage: '#8FA68E',
  black: '#0A0A0A',
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',
} as const;

export type TokenName = keyof typeof TOKENS;

export const WHATSAPP_NUMBER = '5511988063432';
export const INSTAGRAM_HANDLE = 'uni_bolsas';
