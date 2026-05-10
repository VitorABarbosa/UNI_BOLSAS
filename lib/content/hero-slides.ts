/**
 * Slides do carousel principal do Hero da Home.
 *
 * Para cada slide:
 *  - `key`:   identificador estável (usado no React key)
 *  - `image`: caminho a partir de `public/` (sugestão: `public/hero/<nome>.jpg`)
 *  - `alt`:   texto alternativo da imagem
 *  - `tag`:   label curto exibido no canto superior direito do slide
 *
 * Para trocar uma imagem: substitua o arquivo em `public/hero/` mantendo o
 * mesmo nome OU edite `image` aqui apontando para o novo arquivo.
 */

export type HeroSlide = {
  key: string;
  image: string;
  alt: string;
  tag: string;
};

export const HERO_SLIDES: ReadonlyArray<HeroSlide> = [
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
