export const TESTIMONIALS = [
  {
    quote:
      'Compro pra minha loja há três anos. Atendimento direto, sem intermediário, e mix sempre afinado.',
    name: 'Camila Reis',
    role: 'Lojista · Goiânia, GO',
  },
] as const satisfies ReadonlyArray<{ quote: string; name: string; role: string }>;

export type Testimonial = (typeof TESTIMONIALS)[number];
