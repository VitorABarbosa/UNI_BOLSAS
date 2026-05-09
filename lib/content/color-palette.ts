export const COLOR_PALETTE = [
  { name: 'Preto', hex: '#0F0F0F' },
  { name: 'Off-White', hex: '#EFE9DC' },
  { name: 'Caramelo', hex: '#A47551' },
  { name: 'Vinho', hex: '#5C1A2B' },
  { name: 'Marinho', hex: '#1A2B4A' },
  { name: 'Pink', hex: '#C73C7E' },
  { name: 'Rosa', hex: '#E5B5B0' },
  { name: 'Cinza', hex: '#7A7C80' },
  { name: 'Nude', hex: '#C9A98C' },
  { name: 'Vermelho', hex: '#A82238' },
] as const satisfies ReadonlyArray<{ name: string; hex: string }>;

export type PaletteColor = (typeof COLOR_PALETTE)[number];
