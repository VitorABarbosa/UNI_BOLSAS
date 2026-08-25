/**
 * Reels do @uni_bolsas exibidos na seção "Spoiler do feed" da home.
 *
 * `cover` é o caminho de uma imagem em /public — a capa real do Reel.
 * Enquanto for `null`, o card usa uma foto da campanha desfocada como
 * provocação ("spoiler"), pra não fingir que a foto é um frame do vídeo.
 * Pra trocar: salve a capa em public/instagram/<id>.jpg e aponte aqui.
 */
export type ReelItem = {
  /** Código do Reel na URL do Instagram. */
  id: string;
  /** Link completo do Reel. */
  url: string;
  /** Capa real em /public, ou null pra usar o teaser desfocado. */
  cover: string | null;
};

export const REELS: ReelItem[] = [
  {
    id: 'DcAHJUURKWn',
    url: 'https://www.instagram.com/reel/DcAHJUURKWn/',
    cover: null,
  },
  {
    id: 'DcOI2jMB6fm',
    url: 'https://www.instagram.com/reel/DcOI2jMB6fm/',
    cover: null,
  },
  {
    id: 'Dcd6L2phJYz',
    url: 'https://www.instagram.com/reel/Dcd6L2phJYz/',
    cover: null,
  },
];

/** Fotos da campanha usadas como teaser enquanto não há capa real. */
export const REEL_TEASERS = ['/hero/slide-1.jpg', '/hero/slide-2.jpg'];
