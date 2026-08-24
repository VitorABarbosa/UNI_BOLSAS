/**
 * Rede de segurança para imagens estáticas absurdamente grandes em `public/`.
 *
 * Não é para uso rotineiro. Quem entrega as imagens ao navegador é o
 * `next/image`, que gera as variantes responsivas (WebP/AVIF no tamanho da
 * tela) a partir do arquivo original — ou seja, um master em alta resolução
 * NÃO pesa na página, e vale a pena manter pela qualidade em telas retina.
 * Os limites abaixo existem só para pegar arquivo de resolução de impressão
 * (dezenas de MB), que faz o otimizador consumir memória à toa.
 *
 * Uso:
 *   pnpm images:optimize            # otimiza tudo que estiver acima do limite
 *   pnpm images:optimize --dry      # só relata, não escreve
 *
 * Idempotente: rodar de novo em arquivo já otimizado não degrada (só reencoda
 * se o arquivo estiver acima de MAX_WIDTH ou de MAX_BYTES).
 */
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

/** Teto de largura. 3840px é o maior tamanho que o `next/image` chega a gerar. */
const MAX_WIDTH = 3840;
/** Acima disso o arquivo é reencodado mesmo se já estiver dentro da largura. */
const MAX_BYTES = 8 * 1024 * 1024;
const QUALITY = 78;

const TARGET_DIRS = ['public/hero'];
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const dry = process.argv.includes('--dry');

async function optimizeFile(path: string): Promise<void> {
  const before = (await stat(path)).size;
  const input = await readFile(path);
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;

  if (width <= MAX_WIDTH && before <= MAX_BYTES) {
    console.log(`  skip  ${path} (${width}px, ${kb(before)})`);
    return;
  }

  const output = await sharp(input)
    .resize({ width: Math.min(width || MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();

  if (output.length >= before) {
    console.log(`  keep  ${path} (reencode ficou maior: ${kb(output.length)})`);
    return;
  }

  if (!dry) await writeFile(path, output);
  console.log(
    `  ok    ${path} ${width}px→${Math.min(width, MAX_WIDTH)}px · ${kb(before)}→${kb(output.length)} (-${pct(before, output.length)})`,
  );
}

function kb(n: number): string {
  return n > 1048576 ? `${(n / 1048576).toFixed(2)}MB` : `${Math.round(n / 1024)}KB`;
}
function pct(before: number, after: number): string {
  return `${Math.round((1 - after / before) * 100)}%`;
}

async function main(): Promise<void> {
  console.log(dry ? 'Dry run — nada será escrito.\n' : '');
  for (const dir of TARGET_DIRS) {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      console.log(`${dir}/ — não existe, pulando`);
      continue;
    }
    console.log(`${dir}/`);
    for (const name of entries) {
      if (!EXTS.has(extname(name).toLowerCase())) continue;
      await optimizeFile(join(dir, name));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
