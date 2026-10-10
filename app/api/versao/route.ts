import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/** Momento em que este arquivo foi compilado — muda a cada build. */
const COMPILADO_EM = new Date().toISOString();

/**
 * Diagnóstico de deploy: diz qual endereço público o servidor está usando.
 *
 * Existe porque a pergunta "a correção já subiu?" custou semanas. O link da
 * bolsa saía apontando pra `0.0.0.0:3000` e não havia como saber, de fora, se
 * o site rodava a versão antiga ou a nova com a correção — as duas devolvem a
 * mesma página pro visitante. Aqui o servidor responde direto: este é o
 * endereço que eu coloco nos links que saem daqui.
 *
 * Só devolve o que já é público (o próprio domínio) mais o ambiente e a hora
 * do build. Nada de variável de ambiente, chave ou caminho interno.
 */
export function GET() {
  return NextResponse.json(
    {
      enderecoPublico: SITE_URL,
      ambiente: process.env.NODE_ENV ?? '(vazio)',
      compiladoEm: COMPILADO_EM,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
