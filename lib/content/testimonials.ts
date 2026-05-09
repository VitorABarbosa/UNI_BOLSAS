export const TESTIMONIALS = [
  {
    quote:
      'Compro pra minha loja há três anos. Atendimento direto, sem intermediário, e mix sempre afinado.',
    name: 'Camila Reis',
    role: 'Lojista · Goiânia, GO',
  },
  {
    quote:
      'Fui buscar uma bolsa pro trabalho e saí com duas. A Adriana me ajudou a escolher cor pelo guarda-roupa.',
    name: 'Marina S.',
    role: 'Cliente · São Paulo, SP',
  },
  {
    quote: 'Material melhor do que parecia na foto. Já é a quarta que compro.',
    name: 'Letícia A.',
    role: 'Cliente · Curitiba, PR',
  },
] as const satisfies ReadonlyArray<{ quote: string; name: string; role: string }>;

export type Testimonial = (typeof TESTIMONIALS)[number];
