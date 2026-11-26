import { NextResponse, type NextRequest } from 'next/server';
import { ehAdmin } from '@/lib/auth/require-admin';
import { clienteAtual } from '@/lib/contas/sessao';
import { lerEstado } from '@/lib/automacao/pedido';
import { baixarArquivo, consultarNota } from '@/lib/automacao/focus';

/**
 * PDF (DANFE) ou XML da nota do pedido. Os arquivos ficam na Focus NFe e só
 * saem com o nosso token, então passam por aqui: a dona do pedido (logada)
 * ou um administrador.
 *
 *   /api/nota/UB-…            → PDF
 *   /api/nota/UB-…?formato=xml → XML
 */
export const dynamic = 'force-dynamic';

const REF = /^[A-Z0-9-]{6,40}$/;

export async function GET(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!REF.test(ref)) return new NextResponse('Pedido inválido.', { status: 400 });
  const xml = req.nextUrl.searchParams.get('formato') === 'xml';

  const admin = await ehAdmin();
  let caminho: string | null | undefined;
  if (admin) {
    // Administrador: vale também para as notas de teste (consulta direto na Focus).
    const estado = await lerEstado(ref).catch(() => null);
    caminho = xml ? estado?.nota?.caminhoXml : estado?.nota?.caminhoDanfe;
    if (!caminho) {
      const nota = await consultarNota(ref).catch(() => null);
      caminho = xml ? nota?.caminho_xml_nota_fiscal : nota?.caminho_danfe;
    }
  } else {
    const cliente = await clienteAtual();
    if (!cliente) return NextResponse.redirect(new URL(`/conta/entrar?next=/pedido/${ref}`, req.nextUrl.origin));
    const estado = await lerEstado(ref).catch(() => null);
    if (!estado?.cliente?.email || estado.cliente.email.toLowerCase() !== cliente.email?.toLowerCase()) {
      return new NextResponse('Nota não encontrada.', { status: 404 });
    }
    caminho = xml ? estado.nota?.caminhoXml : estado.nota?.caminhoDanfe;
  }
  if (!caminho) return new NextResponse('Nota não encontrada.', { status: 404 });

  try {
    const r = await baixarArquivo(caminho);
    if (!r.ok) return new NextResponse('Não conseguimos buscar a nota agora. Tente de novo em instantes.', { status: 502 });
    return new NextResponse(r.body, {
      headers: {
        'Content-Type': xml ? 'application/xml' : 'application/pdf',
        'Content-Disposition': `${xml ? 'attachment' : 'inline'}; filename="nota-${ref}.${xml ? 'xml' : 'pdf'}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('Não conseguimos buscar a nota agora. Tente de novo em instantes.', { status: 502 });
  }
}
