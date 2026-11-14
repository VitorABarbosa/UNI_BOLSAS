import { NextResponse, type NextRequest } from 'next/server';
import { createAnonClient } from '@/lib/supabase/anon';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A ficha de uma peça — descrição, medidas, peso e material — pra janela de
 * detalhes do catálogo.
 *
 * Esses campos ficam de fora da consulta do catálogo de propósito: uma
 * descrição vinda da Shopee passa de 2 mil caracteres, e com centenas de
 * peças a home carregaria meio megabyte de texto que quase ninguém lê. A
 * janela busca a ficha só da peça que foi aberta.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'peça inválida' }, { status: 400 });
  }
  const { data, error } = await createAnonClient()
    .from('products')
    .select('description, dimensions, weight, material')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: 'indisponível' }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ error: 'peça não encontrada' }, { status: 404 });
  }
  // Só os quatro campos, montados à mão: a resposta é pública e não pode
  // carregar nada além do que a janela mostra.
  const ficha = {
    description: data.description,
    dimensions: data.dimensions,
    weight: data.weight,
    material: data.material,
  };
  return NextResponse.json(ficha, {
    // Igual ao resto do catálogo: muda no painel, aparece em até um minuto.
    headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
