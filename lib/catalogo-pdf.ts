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

export type CorPdf = { nome: string; hex: string; destaque: string | null };

export type PecaPdf = {
  nome: string;
  preco: string | null;
  precoDe: string | null;
  cores: CorPdf[];
  tamanhos: string[];
  codigo: string | null;
  link: string | null;
  foto: string | null;
};

export type GrupoPdf = { categoria: string; pecas: PecaPdf[] };

export type CatalogoPdf = {
  titulo: string;
  subtitulo: string;
  dados: ReadonlyArray<readonly [string, string]> | null;
  /** Linha curta de contato no pé de cada página (só na versão com preços). */
  contato: string | null;
  rodape: string | null;
  /** Foto da capa — um endereço do próprio site. */
  capa: string | null;
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

const FOTO_W = 720;
const FOTO_H = 720;

/**
 * Baixa a foto e devolve um JPEG já recortado no formato do card.
 *
 * Passa primeiro pelo otimizador do próprio site: é o mesmo endereço (sem
 * bloqueio entre domínios) e, quando ele funciona, chega uma foto leve. Se
 * falhar, tenta o arquivo original. A conversão pra JPEG via canvas resolve
 * WebP e PNG, que o PDF não aceita do mesmo jeito.
 */
async function carregarFoto(
  original: string,
  w = FOTO_W,
  h = FOTO_H,
): Promise<string | null> {
  const tentativas = [
    `/_next/image?url=${encodeURIComponent(original)}&w=828&q=75`,
    original,
  ];
  for (const url of tentativas) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const bmp = await createImageBitmap(await r.blob());
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      // Recorte central, como a foto aparece no card do site.
      const escala = Math.max(w / bmp.width, h / bmp.height);
      const dw = bmp.width * escala;
      const dh = bmp.height * escala;
      ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh);
      bmp.close?.();
      return canvas.toDataURL('image/jpeg', 0.82);
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
//
// Duas peças por linha, foto quadrada grande, e as cores sempre à mostra:
// bolinha na cor de verdade (com a segunda cor em meia-lua, quando houver) e o
// nome ao lado. Cada categoria abre página nova, com o nome dela em destaque.

type Rgb = [number, number, number];

const PAGINA_W = 210;
const PAGINA_H = 297;
const MARGEM = 14;
const COLUNAS = 2;
const VAO = 10;
const COL_W = (PAGINA_W - 2 * MARGEM - (COLUNAS - 1) * VAO) / COLUNAS;
/** Onde a grade começa, abaixo do cabeçalho de toda página interna. */
const GRADE_Y = 31;
const LIMITE_Y = PAGINA_H - 17;
/** Duas linhas por página, sempre: a grade fica regular do começo ao fim. */
const LINHAS = 2;
const VAO_LINHA = 8;
const CELULA_H = (LIMITE_Y - GRADE_Y - (LINHAS - 1) * VAO_LINHA) / LINHAS;

const TINTA: Rgb = [17, 17, 17];
const CARVAO: Rgb = [42, 39, 36];
const PEDRA: Rgb = [110, 102, 92];
const COURO: Rgb = [107, 67, 38];
const OSSO: Rgb = [244, 239, 230];
const FIO: Rgb = [229, 222, 207];

/** Texto alinhado à direita COM espaço entre letras (o jsPDF erra a conta). */
function textoDireita(
  doc: import('jspdf').jsPDF,
  texto: string,
  direita: number,
  y: number,
  espaco: number,
) {
  const w = doc.getTextWidth(texto) + espaco * Math.max(0, texto.length - 1);
  doc.text(texto, direita - w, y, { charSpace: espaco });
}

function rgb(hex: string | null | undefined): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Cor clara demais some no papel: ganha contorno. */
function clara([r, g, b]: Rgb): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}

export async function gerarCatalogoPdf(
  cat: CatalogoPdf,
  progresso: (feitas: number, total: number) => void,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pecas = cat.grupos.flatMap((g) => g.pecas);
  const [logo, capa, fotos] = await Promise.all([
    carregarLogo(),
    cat.capa ? carregarFoto(cat.capa, 1200, 900) : Promise.resolve(null),
    carregarTodas(
      pecas.map((p) => p.foto),
      progresso,
    ),
  ]);
  const fotoDe = new Map(pecas.map((p, i) => [p, fotos[i]]));

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: limpar(cat.titulo), creator: 'Uni Bolsas' });
  const largura = PAGINA_W - 2 * MARGEM;

  // ---------------------------------------------------------------- capa
  doc.setFillColor(...OSSO);
  doc.rect(0, 0, PAGINA_W, PAGINA_H, 'F');
  let y = MARGEM + 2;
  if (logo) doc.addImage(logo, 'PNG', MARGEM, y, 12, 12);
  doc.setFont('times', 'italic');
  doc.setFontSize(17);
  doc.setTextColor(...TINTA);
  doc.text('Uni Bolsas', MARGEM + (logo ? 16 : 0), y + 8.3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PEDRA);
  textoDireita(doc, 'BRÁS · SÃO PAULO', PAGINA_W - MARGEM, y + 8, 0.6);
  y += 22;

  if (capa) {
    const h = largura * 0.75;
    doc.addImage(capa, 'JPEG', MARGEM, y, largura, h, undefined, 'FAST');
    y += h + 20;
  } else {
    y += 40;
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(40);
  doc.setTextColor(...TINTA);
  const tituloLinhas: string[] = doc.splitTextToSize(limpar(cat.titulo), largura);
  doc.text(tituloLinhas, MARGEM, y);
  y += tituloLinhas.length * 14 - 4;
  doc.setDrawColor(...COURO);
  doc.setLineWidth(0.5);
  doc.line(MARGEM, y, MARGEM + 22, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...PEDRA);
  doc.text(limpar(cat.subtitulo), MARGEM, y);
  y += 12;

  if (cat.dados) {
    const colW = largura / cat.dados.length;
    let alturaMax = 0;
    cat.dados.forEach(([rotulo, valor], i) => {
      const x = MARGEM + i * colW;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COURO);
      doc.text(limpar(rotulo).toUpperCase(), x, y, { charSpace: 0.4 });
      doc.setFontSize(10);
      doc.setTextColor(...TINTA);
      const linhas: string[] = doc.splitTextToSize(limpar(valor), colW - 6);
      doc.text(linhas, x, y + 5.5);
      alturaMax = Math.max(alturaMax, 5.5 + linhas.length * 4.6);
    });
    y += alturaMax + 6;
  }

  // Índice: as categorias e quantas peças cada uma tem.
  if (cat.grupos.length > 1 && y < PAGINA_H - 40) {
    doc.setDrawColor(...FIO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, y, PAGINA_W - MARGEM, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    let x = MARGEM;
    for (const g of cat.grupos) {
      const rotulo = `${limpar(g.categoria)}  ${g.pecas.length}`;
      const w = doc.getTextWidth(rotulo) + 10;
      if (x + w > PAGINA_W - MARGEM) {
        x = MARGEM;
        y += 6;
      }
      doc.setTextColor(...TINTA);
      doc.text(limpar(g.categoria), x, y);
      doc.setTextColor(...PEDRA);
      doc.text(String(g.pecas.length), x + doc.getTextWidth(limpar(g.categoria) + '  '), y);
      x += w;
    }
  }

  // ------------------------------------------------------- peças
  /** Mede o card antes de desenhar: a linha toma a altura do maior. */
  const medir = (p: PecaPdf) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    let nome: string[] = doc.splitTextToSize(limpar(p.nome), COL_W);
    if (nome.length > 2) {
      nome = nome.slice(0, 2);
      nome[1] = (nome[1] ?? '').replace(/\s*\S*$/, '') + '…';
    }
    // As cores quebram em linhas, como palavras: bolinha + nome.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const linhasCor: { cor: CorPdf; x: number }[][] = [];
    let atual: { cor: CorPdf; x: number }[] = [];
    let x = 0;
    for (const cor of p.cores) {
      const w = 5.2 + doc.getTextWidth(limpar(cor.nome)) + 4.5;
      if (x + w > COL_W && atual.length) {
        linhasCor.push(atual);
        atual = [];
        x = 0;
      }
      atual.push({ cor, x });
      x += w;
    }
    if (atual.length) linhasCor.push(atual);
    // Até três linhas de cores (umas 12); só o que passar disso vira "+N".
    let sobra = 0;
    if (linhasCor.length > 3) {
      sobra = linhasCor.slice(3).reduce((n, l) => n + l.length, 0);
      linhasCor.length = 3;
    }
    /** Altura de tudo que vem abaixo da foto. */
    const texto =
      6 +
      nome.length * 5.2 +
      (p.preco ? 6.5 : 0) +
      2 +
      Math.max(1, linhasCor.length) * 5.4 +
      (p.tamanhos.length ? 5 : 0) +
      (p.codigo ? 4 : 0);
    return { nome, linhasCor, sobra, texto };
  };

  /**
   * Topo das páginas internas. Na primeira página de uma categoria o nome
   * dela vem grande; nas seguintes, discreto, ao lado da marca. Os dois
   * ocupam a mesma altura, então a grade começa sempre no mesmo lugar.
   */
  const cabecalhoInterno = (grupo: GrupoPdf, primeira: boolean) => {
    const nome = limpar(grupo.categoria);
    if (primeira) {
      doc.setFont('times', 'normal');
      doc.setFontSize(26);
      doc.setTextColor(...TINTA);
      doc.text(nome, MARGEM, 21);
      const w = doc.getTextWidth(nome);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...PEDRA);
      const n = grupo.pecas.length;
      doc.text(`${n} ${n === 1 ? 'modelo' : 'modelos'}`, MARGEM + w + 4, 21);
    } else {
      doc.setFont('times', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(...TINTA);
      doc.text(nome, MARGEM, 20);
    }
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COURO);
    textoDireita(doc, 'Uni Bolsas', PAGINA_W - MARGEM, 20.5, 0);
    doc.setDrawColor(...FIO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, 25, PAGINA_W - MARGEM, 25);
  };

  const desenharCard = (
    p: PecaPdf,
    m: ReturnType<typeof medir>,
    x: number,
    y0: number,
    fotoH: number,
  ) => {
    let ty = y0;
    const foto = fotoDe.get(p);
    if (foto) {
      // A foto vem quadrada; aqui ela é recortada na altura da linha,
      // pelo centro (o mesmo enquadramento do card do site).
      doc.saveGraphicsState();
      doc.rect(x, ty, COL_W, fotoH, null);
      doc.clip();
      doc.discardPath();
      doc.addImage(foto, 'JPEG', x, ty - (COL_W - fotoH) / 2, COL_W, COL_W, undefined, 'FAST');
      doc.restoreGraphicsState();
    } else {
      doc.setFillColor(...OSSO);
      doc.rect(x, ty, COL_W, fotoH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...PEDRA);
      doc.text('Foto em breve', x + COL_W / 2, ty + fotoH / 2, { align: 'center' });
    }
    ty += fotoH + 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(...TINTA);
    doc.text(m.nome, x, ty);
    ty += m.nome.length * 5.2;

    if (p.preco) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...TINTA);
      const preco = limpar(p.preco);
      doc.text(preco, x, ty + 1);
      if (p.precoDe) {
        const w = doc.getTextWidth(preco);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...PEDRA);
        const de = limpar(p.precoDe);
        doc.text(de, x + w + 3, ty + 1);
        doc.setDrawColor(...PEDRA);
        doc.setLineWidth(0.2);
        doc.line(x + w + 3, ty - 0.2, x + w + 3 + doc.getTextWidth(de), ty - 0.2);
      }
      ty += 6.5;
    }
    // Cores — sempre à mostra.
    ty += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (m.linhasCor.length === 0) {
      doc.setTextColor(...PEDRA);
      doc.text('Cores sob consulta', x, ty);
      ty += 5.4;
    }
    for (const linha of m.linhasCor) {
      for (const { cor, x: cx } of linha) {
        const c = rgb(cor.hex) ?? PEDRA;
        const d = rgb(cor.destaque);
        const rx = x + cx + 1.9;
        const ry = ty - 1.2;
        doc.setFillColor(...c);
        doc.circle(rx, ry, 1.9, 'F');
        if (d) {
          // Segunda cor da peça (ex.: alça de outra cor): meia-lua.
          doc.setFillColor(...d);
          const pts = 12;
          const arco: [number, number][] = [];
          for (let k = 0; k <= pts; k++) {
            const a = -Math.PI / 4 + (Math.PI * k) / pts;
            arco.push([rx + 1.9 * Math.cos(a), ry + 1.9 * Math.sin(a)]);
          }
          const [p0, ...resto] = arco;
          if (p0) {
            const rel: [number, number][] = [];
            let [px, py] = p0;
            for (const [qx, qy] of resto) {
              rel.push([qx - px, qy - py]);
              px = qx;
              py = qy;
            }
            rel.push([p0[0] - px, p0[1] - py]);
            doc.lines(rel, p0[0], p0[1], [1, 1], 'F', true);
          }
        }
        if (clara(c)) {
          doc.setDrawColor(...PEDRA);
          doc.setLineWidth(0.15);
          doc.circle(rx, ry, 1.9, 'S');
        }
        doc.setTextColor(...CARVAO);
        doc.text(limpar(cor.nome), x + cx + 5.2, ty);
      }
      ty += 5.4;
    }
    if (m.sobra > 0) {
      // Não cabe mais nada na última linha: o "+N" vai no fim dela.
      const ultima = m.linhasCor[m.linhasCor.length - 1];
      const fim = ultima?.[ultima.length - 1];
      if (fim) {
        doc.setTextColor(...PEDRA);
        const xFim = x + fim.x + 5.2 + doc.getTextWidth(limpar(fim.cor.nome)) + 3;
        doc.text(`+${m.sobra}`, Math.min(xFim, x + COL_W - 6), ty - 5.4);
      }
    }

    if (p.tamanhos.length) {
      doc.setFontSize(8.5);
      doc.setTextColor(...CARVAO);
      doc.text(`Tamanhos: ${p.tamanhos.map(limpar).join(' · ')}`, x, ty);
      ty += 5;
    }
    if (p.codigo) {
      ty -= 1;
      doc.setFontSize(7.5);
      doc.setTextColor(...PEDRA);
      const cod = limpar(`Cód. ${p.codigo}${p.link ? `  ·  ${p.link}` : ''}`);
      doc.text(doc.splitTextToSize(cod, COL_W)[0] ?? cod, x, ty);
    }
  };

  for (const grupo of cat.grupos) {
    // Cada categoria abre página; cada página tem duas linhas de duas peças.
    for (let i = 0; i < grupo.pecas.length; i += COLUNAS) {
      const linhaNaPagina = (i / COLUNAS) % LINHAS;
      if (linhaNaPagina === 0) {
        doc.addPage();
        cabecalhoInterno(grupo, i === 0);
      }
      const y0 = GRADE_Y + linhaNaPagina * (CELULA_H + VAO_LINHA);
      const linha = grupo.pecas.slice(i, i + COLUNAS);
      const medidas = linha.map(medir);
      // A foto ocupa o que sobra da célula depois do texto mais alto da
      // linha — as duas fotos da linha ficam do mesmo tamanho.
      const fotoH = Math.min(
        COL_W,
        CELULA_H - Math.max(...medidas.map((m) => m.texto)),
      );
      linha.forEach((p, ci) => {
        const m = medidas[ci];
        if (m) desenharCard(p, m, MARGEM + ci * (COL_W + VAO), y0, fotoH);
      });
      y = y0 + fotoH + Math.max(...medidas.map((m) => m.texto));
    }
  }

  if (cat.rodape) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const linhas: string[] = doc.splitTextToSize(limpar(cat.rodape), largura);
    const ultimo = cat.grupos[cat.grupos.length - 1];
    if (y + 12 + linhas.length * 4 > LIMITE_Y && ultimo) {
      doc.addPage();
      cabecalhoInterno(ultimo, false);
      y = GRADE_Y - 4;
    }
    y += 8;
    doc.setDrawColor(...FIO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, y, PAGINA_W - MARGEM, y);
    doc.setTextColor(...PEDRA);
    doc.text(linhas, MARGEM, y + 6);
  }

  // Pé de página em todas, menos a capa: contato e "página X de Y".
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...FIO);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, PAGINA_H - 12, PAGINA_W - MARGEM, PAGINA_H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COURO);
    doc.text(limpar(cat.contato ?? cat.titulo), MARGEM, PAGINA_H - 7.5);
    doc.setTextColor(...PEDRA);
    doc.text(`${i - 1} de ${total - 1}`, PAGINA_W - MARGEM, PAGINA_H - 7.5, { align: 'right' });
  }

  return doc.output('blob');
}
