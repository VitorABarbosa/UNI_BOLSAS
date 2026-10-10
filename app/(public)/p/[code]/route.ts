import type { NextRequest } from 'next/server';
import { createAnonClient } from '@/lib/supabase/anon';
import { redirectToSite } from '@/lib/public-redirect';

/**
 * Link curto da peça: /p/<8 primeiros caracteres do id> → página do produto.
 *
 * Existe por causa do WhatsApp. A mensagem de interesse leva o endereço da
 * peça, e o endereço real — /produtos/<slug> — passa de 80 caracteres e
 * engole a mensagem. O código de 8 caracteres do id resolve: curto, estável
 * (não muda se o produto for renomeado) e com colisão improvável mesmo com
 * milhares de peças.
 *
 * A busca por prefixo é feita aqui em memória, sobre id+slug de todos os
 * produtos ativos: o id é uuid no banco, que não aceita `like`, e o catálogo
 * tem centenas de linhas — uma consulta leve. Código desconhecido cai na
 * home, nunca em erro: o link chegou por mensagem, a pessoa não tem o que
 * fazer com um 404.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!/^[0-9a-f]{8}$/.test(code)) return redirectToSite('/');

  try {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from('products')
      .select('id, slug')
      .eq('active', true);

    const match = (data ?? []).find((p) => p.id.startsWith(code));
    if (match) return redirectToSite(`/produtos/${match.slug}`);
  } catch {
    /* banco fora do ar não pode transformar um link de cliente em erro */
  }
  return redirectToSite('/');
}
