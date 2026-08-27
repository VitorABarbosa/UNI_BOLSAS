/**
 * Resolve o thumbnail de um vídeo do Vimeo pra servir de poster no hero.
 *
 * O player do Vimeo é um app inteiro dentro de um iframe: até ele baixar,
 * inicializar e começar a tocar, o quadro fica vazio. O poster cobre esse
 * intervalo — aparece junto com a página e sai de cena quando o vídeo
 * realmente está rodando (ver HeroCarousel).
 *
 * A URL vem do oEmbed público do Vimeo e fica em cache por 24h no servidor;
 * se a chamada falhar, devolve null e o hero se comporta como antes
 * (player sem poster) — nunca derruba a home.
 */
import 'server-only';

const OEMBED_ENDPOINT = 'https://vimeo.com/api/oembed.json';
const POSTER_WIDTH = 1920;
const REVALIDATE_SECONDS = 60 * 60 * 24;

export async function getVimeoPosterUrl(
  vimeoId: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    url: `https://vimeo.com/${vimeoId}`,
    width: String(POSTER_WIDTH),
  });
  try {
    const res = await fetch(`${OEMBED_ENDPOINT}?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const thumb =
      data && typeof data === 'object' && 'thumbnail_url' in data
        ? (data as { thumbnail_url?: unknown }).thumbnail_url
        : null;
    if (typeof thumb !== 'string' || thumb.length === 0) return null;
    // O oEmbed devolve o thumb num tamanho fixo (sufixo `_640x360` ou `_640`
    // antes da extensão). Troca pelo tamanho cheio; se o formato mudar e o
    // regex não casar, a URL original ainda funciona.
    return thumb.replace(
      /_\d+(?:x\d+)?(?=(?:\.\w+)?(?:\?.*)?$)/,
      `_${POSTER_WIDTH}`,
    );
  } catch {
    return null;
  }
}
