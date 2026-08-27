/**
 * Slides do carousel principal do Hero da Home.
 *
 * Para cada slide:
 *  - `key`:     identificador estável (usado no React key)
 *  - `alt`:     descrição do conteúdo (acessibilidade)
 *  - `tag`:     label curto exibido no canto superior direito do slide
 *  - `image`:   slide de FOTO — caminho a partir de `public/`
 *  - `video`:   slide de VÍDEO — caminho SEM extensão a partir de `public/`.
 *               O componente monta `<nome>.webm` e `<nome>.mp4` e deixa o
 *               navegador escolher: WebM onde houver suporte (arquivo menor),
 *               MP4/H.264 no resto.
 *  - `poster`:  capa do slide de vídeo, exibida INSTANTANEAMENTE enquanto o
 *               vídeo ainda não tem frame pra mostrar
 *
 * Cada slide tem OU `image` OU `video`.
 *
 * VÍDEO: o arquivo é servido pelo próprio site, não por um player de terceiro.
 * É o que permite ele começar junto com a página: sem abrir conexão com outro
 * domínio, sem baixar player nenhum antes. Para trocar o filme, gere os dois
 * formatos e a capa (veja `scripts/encode-hero-video.md`) e aponte aqui.
 *
 * POSTER: enquanto o vídeo não tem frame, é o poster que aparece — por isso
 * ele nunca deve faltar num slide de vídeo. Use o frame 0 do próprio vídeo:
 * assim a entrada não tem troca visível, o quadro só ganha movimento.
 */

export type HeroSlide = {
  key: string;
  alt: string;
  tag: string;
  image?: string;
  /** Caminho sem extensão: `.webm` e `.mp4` são montados a partir dele. */
  video?: string;
  poster?: string;
};

export const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
  {
    key: 'filme',
    video: '/hero/filme',
    // O frame 0 do próprio vídeo: a capa e o primeiro quadro são a mesma
    // imagem, então a entrada do vídeo não tem troca visível.
    poster: '/hero/filme-capa.jpg',
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
