export const CREDIBILITY_STATS = [
  { value: 10, prefix: '+', suffix: 'anos', label: 'no Brás' },
  { value: 500, prefix: '+', suffix: '', label: 'Modelos no catálogo' },
  { value: 5000, prefix: '+', suffix: '', label: 'Lojistas atendidas' },
  { value: 2, prefix: '', suffix: '', label: 'Atacado · Varejo · Loja física' },
] as const satisfies ReadonlyArray<{
  value: number;
  prefix: string;
  suffix: string;
  label: string;
}>;

export type CredibilityStat = (typeof CREDIBILITY_STATS)[number];
