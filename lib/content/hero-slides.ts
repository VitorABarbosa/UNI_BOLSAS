/**
 * Slides do carousel principal do Hero da Home.
 *
 * Para cada slide:
 *  - `key`:     identificador estável (usado no React key)
 *  - `alt`:     descrição do conteúdo (acessibilidade)
 *  - `tag`:     label curto exibido no canto superior direito do slide
 *  - `image`:   slide de FOTO — caminho a partir de `public/`
 *  - `vimeoId`: slide de VÍDEO — id do vídeo no Vimeo, tocado pelo player
 *               em modo background (mudo, em loop, sem controles)
 *
 * Cada slide tem OU `image` OU `vimeoId`, nunca os dois.
 *
 * Para trocar uma imagem: substitua o arquivo em `public/hero/` mantendo o
 * mesmo nome OU edite `image` aqui apontando para o novo arquivo.
 * Para trocar o vídeo: troque o `vimeoId` (o número no fim do link do Vimeo).
 */

export type HeroSlide = {
  key: string;
  alt: string;
  tag: string;
  image?: string;
  vimeoId?: string;
};

export const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
  {
    key: 'filme',
    vimeoId: '1221303809',
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
