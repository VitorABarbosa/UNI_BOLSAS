/**
 * Posts reais do feed do Instagram exibidos no grid 3x2 da Home (`Social`).
 *
 * Para cada post:
 *  - `shortcode`: identificador do post na URL do IG (`/p/<shortcode>/`)
 *  - `url`:       link do post (abre em nova aba ao clicar no grid)
 *
 * A thumbnail correspondente deve estar em `public/instagram/<shortcode>.jpg`.
 * Se mudar de post: troque o shortcode/URL aqui e suba a nova thumbnail
 * com o mesmo nome (shortcode + .jpg).
 */

export type IgPost = {
  shortcode: string;
  url: string;
};

export const IG_FEED: ReadonlyArray<IgPost> = [
  { shortcode: 'DXvT7HTjpaW', url: 'https://www.instagram.com/p/DXvT7HTjpaW/' },
  { shortcode: 'DXsoDH5kY5M', url: 'https://www.instagram.com/p/DXsoDH5kY5M/' },
  { shortcode: 'DXkFwVakfZI', url: 'https://www.instagram.com/p/DXkFwVakfZI/' },
  { shortcode: 'DXpxNJCEQTI', url: 'https://www.instagram.com/p/DXpxNJCEQTI/' },
  { shortcode: 'DUDyUkxkTWZ', url: 'https://www.instagram.com/p/DUDyUkxkTWZ/' },
  { shortcode: 'DRxSYb4kVl1', url: 'https://www.instagram.com/p/DRxSYb4kVl1/' },
] as const;
