/**
 * Reels do @uni_bolsas exibidos na seção "Spoiler do feed" da home.
 *
 * `cover` é o caminho de uma imagem em /public — a capa real do Reel, salva
 * aqui no site. Não dá pra apontar direto pro Instagram: os endereços de
 * imagem deles expiram em poucas horas e a seção quebraria sozinha.
 *
 * Se um Reel novo entrar sem capa (`cover: null`), o card cai num teaser —
 * uma foto da campanha desfocada — em vez de ficar vazio. É degradação, não
 * o resultado desejado: o certo é sempre ter a capa.
 *
 * Pra adicionar: salve a capa como public/instagram/<id>.jpg e aponte aqui.
 */
export type ReelItem = {
  /** Código do Reel na URL do Instagram. */
  id: string;
  /** Link completo do Reel. */
  url: string;
  /** Capa em /public, ou null pra cair no teaser desfocado. */
  cover: string | null;
};

export const REELS: ReelItem[] = [
  {
    id: 'DcAHJUURKWn',
    url: 'https://www.instagram.com/reel/DcAHJUURKWn/',
    cover: '/instagram/DcAHJUURKWn.jpg',
  },
  {
    id: 'DcOI2jMB6fm',
    url: 'https://www.instagram.com/reel/DcOI2jMB6fm/',
    cover: '/instagram/DcOI2jMB6fm.jpg',
  },
  {
    id: 'Dcd6L2phJYz',
    url: 'https://www.instagram.com/reel/Dcd6L2phJYz/',
    cover: '/instagram/Dcd6L2phJYz.jpg',
  },
];

/** Fotos da campanha usadas como teaser quando um Reel está sem capa. */
export const REEL_TEASERS = ['/hero/slide-1.jpg', '/hero/slide-2.jpg'];
