export const TIMELINE = [
  { year: '2014', label: 'Primeiro stand no Brás' },
  { year: '2018', label: 'Atacado para outros estados' },
  { year: '2022', label: 'Loja própria no Shopping 900' },
  { year: '2026', label: '+5.000 lojistas atendidas' },
] as const satisfies ReadonlyArray<{ year: string; label: string }>;

export type TimelineMilestone = (typeof TIMELINE)[number];
