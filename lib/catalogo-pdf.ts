/**
 * O PDF do catálogo, gerado no próprio aparelho.
 *
 * A primeira versão usava a impressão do navegador ("Salvar como PDF"), e no
 * celular isso não chegava a lugar nenhum: o navegador embutido do
 * Instagram/Facebook não tem impressão, e nos outros o caminho até o PDF é
 * escondido. Aqui o arquivo é montado com jsPDF e entregue como arquivo de
 * verdade — baixa, ou vai direto pro WhatsApp pelo compartilhar do celular.
 *
 * Roda só no navegador. O jsPDF (~350 KB) é carregado no clique, não junto
 * com a página.
 */

export type PecaPdf = {
  nome: string;
  preco: string | null;
  precoDe: string | null;
  cores: string;
  tamanhos: string;
  codigo: string | null;
  link: string | null;
  foto: string | null;
};

export type GrupoPdf = { categoria: string; pecas: PecaPdf[] };

export type CatalogoPdf = {
  titulo: string;
  subtitulo: string;
  dados: ReadonlyArray<readonly [string, string]> | null;
  rodape: string | null;
  grupos: GrupoPdf[];
};

// --- texto -------------------------------------------------------------------

/**
 * As fontes embutidas do PDF só conhecem o alfabeto latino (acentos e ç
 * incluídos). Um emoji num nome de peça viraria lixo no arquivo, então sai.
 */
const EXTRAS = new Set(['—', '–', '…', '“', '”', '‘', '’', '•', '€', '™']);
function limpar(texto: string): string {
  return Array.from(texto)
    .filter((ch) => ch.charCodeAt(0) <= 0xff || EXTRAS.has(ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- fotos -------------------------------------------------------------------

const FOTO_W = 480;
const FOTO_H = 600;

/**
 * Baixa a foto e devolve um JPEG já recortado no formato do card.
 *
 * Passa primeiro pelo otimizador do próprio site: é o mesmo endereço (sem
 * bloqueio entre domínios) e, quando ele funciona, chega uma foto leve. Se
 * falhar, tenta o arquivo original. A conversão pra JPEG via canvas resolve
 * WebP e PNG, que o PDF não aceita do mesmo jeito.
 */
async function carregarFoto(original: string): Promise<string | null> {
  const tentativas = [
    `/_next/image?url=${encodeURIComponent(original)}&w=640&q=75`,
    original,
  ];
  for (const url of tentativas) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const bmp = await createImageBitmap(await r.blob());
      const canvas = document.createElement('canvas');
      canvas.width = FOTO_W;
      canvas.height = FOTO_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, FOTO_W, FOTO_H);
      // Recorte central, como a foto aparece no card do site.
      const escala = Math.max(FOTO_W / bmp.width, FOTO_H / bmp.height);
      const w = bmp.width * escala;
      const h = bmp.height * escala;
      ctx.drawImage(bmp, (FOTO_W - w) / 2, (FOTO_H - h) / 2, w, h);
      bmp.close?.();
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch {
      /* tenta o próximo endereço */
    }
  }
  return null;
}

async function carregarLogo(): Promise<string | null> {
  try {
    const r = await fetch('/LOGO_UNI_BOLSAS_PNG.png');
    if (!r.ok) return null;
    const bmp = await createImageBitmap(await r.blob());
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, 120, 120);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Baixa as fotos de 4 em 4, avisando o andamento. Mais que isso, num celular,
 * são várias fotos grandes abertas na memória ao mesmo tempo.
 */
async function carregarTodas(
  urls: (string | null)[],
  progresso: (feitas: number, total: number) => void,
): Promise<(string | null)[]> {
  const out: (string | null)[] = new Array(urls.length).fill(null);
  let proxima = 0;
  let feitas = 0;
  const total = urls.filter(Boolean).length;
  progresso(0, total);
  const trabalhador = async () => {
    while (proxima < urls.length) {
      const i = proxima++;
      const u = urls[i];
      if (!u) continue;
      out[i] = await carregarFoto(u);
      progresso(++feitas, total);
    }
  };
  await Promise.all(Array.from({ length: 4 }, trabalhador));
  return out;
}

// --- página ------------------------------------------------------------------

const PAGINA_W = 210;
const PAGINA_H = 297;
const MARGEM = 14;
const COLUNAS = 3;
const VAO = 6;
const COL_W = (PAGINA_W - 2 * MARGEM - (COLUNAS - 1) * VAO) / COLUNAS;
const FOTO_MM_H = COL_W * (FOTO_H / FOTO_W);
const RODAPE_Y = PAGINA_H - 8;
const LIMITE_Y = PAGINA_H - 16;

const TINTA: [number, number, number] = [17, 17, 17];
const PEDRA: [number, number, number] = [110, 102, 92];
const COURO: [number, number, number] = [107, 67, 38];
const FUNDO_FOTO: [number, number, number] = [240, 234, 222];

export async function gerarCatalogoPdf(
  cat: CatalogoPdf,
  progresso: (feitas: number, total: number) => void,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pecas = cat.grupos.flatMap((g) => g.pecas);
  const [logo, fotos] = await Promise.all([
    carregarLogo(),
    carregarTodas(
      pecas.map((p) => p.foto),
      progresso,
    ),
  ]);
  const fotoDe = new Map(pecas.map((p, i) => [p, fotos[i]]));

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: limpar(cat.titulo), creator: 'Uni Bolsas' });

  // Capa: marca, título, subtítulo e os dados da loja.
  let y = MARGEM;
  if (logo) doc.addImage(logo, 'PNG', MARGEM, y, 11, 11);
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...TINTA);
  doc.text('Uni Bolsas', MARGEM + (logo ? 14 : 0), y + 7.5);
  y += 24;
  doc.setFont('times', 'normal');
  doc.setFontSize(30);
  doc.text(limpar(cat.titulo), MARGEM, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PEDRA);
  doc.text(limpar(cat.subtitulo), MARGEM, y);
  y += 9;
  if (cat.dados) {
    let x = MARGEM;
    const largura = (PAGINA_W - 2 * MARGEM) / cat.dados.length;
    for (const [rotulo, valor] of cat.dados) {
      doc.setFontSize(7.5);
      doc.setTextColor(...PEDRA);
      doc.text(limpar(rotulo), x, y);
      doc.setFontSize(9.5);
      doc.setTextColor(...TINTA);
      doc.text(doc.splitTextToSize(limpar(valor), largura - 4), x, y + 4.6);
      x += largura;
    }
    y += 14;
  }
  doc.setDrawColor(...TINTA);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, y, PAGINA_W - MARGEM, y);
  y += 9;

  /** Mede o texto de um card: as linhas de cada parte e a altura total. */
  const medir = (p: PecaPdf) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    let nome: string[] = doc.splitTextToSize(limpar(p.nome), COL_W);
    if (nome.length > 3) {
      nome = nome.slice(0, 3);
      nome[2] = (nome[2] ?? '').replace(/\s*\S*$/, '') + '…';
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const extras: string[] = [p.cores, p.tamanhos]
      .filter(Boolean)
      .flatMap((t) => doc.splitTextToSize(limpar(t), COL_W) as string[])
      .slice(0, 3);
    doc.setFontSize(7);
    const cod: string[] = p.codigo
      ? doc.splitTextToSize(limpar(`Cód. ${p.codigo}${p.link ? ` · ${p.link}` : ''}`), COL_W)
      : [];
    const altura =
      FOTO_MM_H + 4.5 + nome.length * 4.3 + (p.preco ? 5 : 0) + extras.length * 3.6 + (cod.length ? 1.2 + cod.length * 3.1 : 0);
    return { nome, extras, cod, altura };
  };

  const novaPagina = () => {
    doc.addPage();
    y = MARGEM;
  };

  for (const grupo of cat.grupos) {
    const linhas: PecaPdf[][] = [];
    for (let i = 0; i < grupo.pecas.length; i += COLUNAS) {
      linhas.push(grupo.pecas.slice(i, i + COLUNAS));
    }
    linhas.forEach((linha, li) => {
      const medidas = linha.map(medir);
      const alturaLinha = Math.max(...medidas.map((m) => m.altura));
      // O título da categoria nunca fica sozinho no pé da página.
      const cabecalho = li === 0 ? 12 : 0;
      if (y + cabecalho + alturaLinha > LIMITE_Y) novaPagina();
      if (li === 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(17);
        doc.setTextColor(...TINTA);
        doc.text(limpar(grupo.categoria), MARGEM, y + 5);
        const w = doc.getTextWidth(limpar(grupo.categoria));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...PEDRA);
        doc.text(String(grupo.pecas.length), MARGEM + w + 3, y + 5);
        y += cabecalho;
      }
      linha.forEach((p, ci) => {
        const m = medidas[ci];
        if (!m) return;
        const x = MARGEM + ci * (COL_W + VAO);
        let ty = y;
        const foto = fotoDe.get(p);
        if (foto) {
          doc.addImage(foto, 'JPEG', x, ty, COL_W, FOTO_MM_H, undefined, 'FAST');
        } else {
          doc.setFillColor(...FUNDO_FOTO);
          doc.rect(x, ty, COL_W, FOTO_MM_H, 'F');
        }
        ty += FOTO_MM_H + 4.5;
        doc.setFont('times', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(...TINTA);
        doc.text(m.nome, x, ty);
        ty += m.nome.length * 4.3;
        if (p.preco) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(limpar(p.preco), x, ty + 0.6);
          if (p.precoDe) {
            const w = doc.getTextWidth(limpar(p.preco));
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...PEDRA);
            const de = limpar(p.precoDe);
            doc.text(de, x + w + 2.5, ty + 0.6);
            const dw = doc.getTextWidth(de);
            doc.setDrawColor(...PEDRA);
            doc.setLineWidth(0.2);
            doc.line(x + w + 2.5, ty - 0.5, x + w + 2.5 + dw, ty - 0.5);
          }
          ty += 5;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 56, 52);
        if (m.extras.length) {
          doc.text(m.extras, x, ty);
          ty += m.extras.length * 3.6;
        }
        if (m.cod.length) {
          doc.setFontSize(7);
          doc.setTextColor(...PEDRA);
          doc.text(m.cod, x, ty + 1.2);
        }
      });
      y += alturaLinha + 7;
    });
    y += 3;
  }

  if (cat.rodape) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const linhas: string[] = doc.splitTextToSize(limpar(cat.rodape), PAGINA_W - 2 * MARGEM);
    if (y + 6 + linhas.length * 3.6 > LIMITE_Y) novaPagina();
    doc.setDrawColor(229, 222, 207);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, y, PAGINA_W - MARGEM, y);
    doc.setTextColor(...PEDRA);
    doc.text(linhas, MARGEM, y + 5);
  }

  // Número de página em todas, agora que o total é conhecido.
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COURO);
    doc.text(limpar(cat.titulo), MARGEM, RODAPE_Y);
    doc.setTextColor(...PEDRA);
    doc.text(`${i} de ${total}`, PAGINA_W - MARGEM, RODAPE_Y, { align: 'right' });
  }

  return doc.output('blob');
}
