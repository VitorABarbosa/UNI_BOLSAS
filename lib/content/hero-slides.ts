/**
 * Slides do carousel principal do Hero da Home.
 *
 * Para cada slide:
 *  - `key`:     identificador estável (usado no React key)
 *  - `alt`:     descrição do conteúdo (acessibilidade)
 *  - `tag`:     label curto exibido no canto superior direito do slide
 *  - `image`:   slide de FOTO — caminho a partir de `public/`
 *  - `video`:   slide de VÍDEO hospedado aqui — caminho a partir de `public/`
 *  - `vimeoId`: slide de VÍDEO no Vimeo — id do vídeo (o número no fim do link)
 *  - `poster`:  capa do slide de vídeo, exibida INSTANTANEAMENTE enquanto o
 *               vídeo ainda não tem frame pra mostrar
 *
 * Cada slide tem exatamente um entre `image`, `video` e `vimeoId`.
 *
 * VÍDEO: `video` (arquivo local) é sempre mais rápido que `vimeoId`. O Vimeo
 * exige abrir conexão com outro domínio, baixar o player deles e só então
 * começar a bufferizar — 2 a 4 segundos de espera. Um MP4 servido pelo próprio
 * site começa quase junto com a página. Para migrar: salve o arquivo em
 * `public/hero/`, troque `vimeoId` por `video: '/hero/<nome>.mp4'` e pronto.
 *
 * POSTER: enquanto o vídeo não está pronto, é o poster que aparece — por isso
 * ele nunca deve faltar num slide de vídeo. O ideal é um frame do próprio
 * vídeo, pra transição virar um crossfade imperceptível.
 */

export type HeroSlide = {
  key: string;
  alt: string;
  tag: string;
  image?: string;
  video?: string;
  vimeoId?: string;
  poster?: string;
};

export const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
  {
    key: 'filme',
    vimeoId: '1221303809',
    // TODO: trocar por um frame real do vídeo quando o arquivo chegar —
    // hoje é uma foto da campanha, que segura o quadro sem deixar preto.
    poster: '/hero/slide-1.jpg',
    alt: 'Uni Bolsas em movimento — filme da coleção',
    tag: 'Em movimento',
  },
  {
    key: 'colecao',
    image: '/hero/slide-1.jpg',
    alt: 'Coleção Uni Bolsas 2026',
    tag: 'Coleção · 2026',
  },
  {
    key: 'atacado-varejo',
    image: '/hero/slide-2.jpg',
    alt: 'Uni Bolsas — Atacado e varejo no Brás',
    tag: 'Atacado · Varejo',
  },
] as const;
