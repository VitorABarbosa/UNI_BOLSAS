# Como preparar o filme do hero

O vídeo do hero é servido pelo próprio site (`public/hero/`), não por um player
de terceiro. É isso que permite ele começar junto com a página. Em troca, o
arquivo precisa ser preparado à mão — um export direto da câmera ou do editor
tem dezenas de MB e não serve.

O arquivo original que veio do cliente tinha **13,5 MB em HEVC (H.265)**. Além
do peso, HEVC não toca em `<video>` no Chrome da maioria das plataformas: sem
reencodar, o hero fica preto pra boa parte dos visitantes.

## Quatro arquivos, e o navegador escolhe um

Duas resoluções × dois formatos. O navegador desce a lista de `<source>` e para
no primeiro que ele consegue tocar e cuja largura de tela bate — **só esse é
baixado**.

| Arquivo | Quem recebe |
| --- | --- |
| `filme-1080.webm` | telas ≥ 900px, Chrome / Firefox / Edge |
| `filme-1080.mp4` | telas ≥ 900px, Safari |
| `filme-720.webm` | telas < 900px, Chrome / Firefox / Edge |
| `filme-720.mp4` | telas < 900px, Safari |

**Por que duas resoluções:** o quadro do hero tem ~1300–1730px de largura no
desktop, e servir 720p ali obriga o navegador a ampliar o vídeo — é isso que
apaga o granulado do couro. No celular o quadro tem ~1170px de pixels reais,
então 1080p seria peso sem ganho visível.

**Por que o celular também usa CRF mais alto:** ali o vídeo é exibido com ~390px
de largura, ou seja, reduzido três vezes. A compressão que no desktop apagaria a
textura, nessa escala some junto com os pixels — conferido lado a lado. E cada
byte pesa mais no celular, que é onde a conexão costuma ser pior.

**Por que dois formatos:** WebM/VP9 sai menor com a mesma qualidade, mas o
Safari não toca. H.264 toca em tudo e cobre o resto.

## Receita

Requer `ffmpeg`. Trocando `ENTRADA.mp4` pelo arquivo novo:

```sh
# --- Desktop (1080p, resolução nativa)
ffmpeg -i ENTRADA.mp4 -an -c:v libvpx-vp9 -crf 24 -b:v 0 \
  -deadline good -cpu-used 3 -row-mt 1 public/hero/filme-1080.webm

ffmpeg -i ENTRADA.mp4 -an -c:v libx264 -profile:v high -level:v 4.0 \
  -pix_fmt yuv420p -crf 20 -preset slow -movflags +faststart -g 48 \
  public/hero/filme-1080.mp4

# --- Celular (720p, mais comprimido: veja a explicação acima)
ffmpeg -i ENTRADA.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 3 -row-mt 1 \
  public/hero/filme-720.webm

ffmpeg -i ENTRADA.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v high -level:v 4.0 -pix_fmt yuv420p \
  -crf 26 -preset slow -movflags +faststart -g 48 public/hero/filme-720.mp4

# --- Capa: o frame 0, o mesmo instante que o vídeo mostra ao começar
ffmpeg -i ENTRADA.mp4 -frames:v 1 -q:v 2 public/hero/filme-capa.jpg
```

Por que cada pedaço:

- **`-crf`** é o controle de qualidade. **No desktop não vale economizar**: o
  produto é a bolsa, e a textura do couro é a primeira coisa que some quando se
  comprime demais — servir 720p comprimido ali já deixou o couro liso uma vez.
  **No celular vale**, porque a imagem é reduzida três vezes na exibição.
  Número menor = mais qualidade e mais peso.
- **`-level:v 4.0`** limita o H.264 a um patamar que qualquer aparelho da
  última década decodifica. Sem isso o x264 marca nível 5.0 no arquivo.
- **`-an`** joga fora o áudio. O vídeo é mudo por natureza (autoplay com som é
  bloqueado pelos navegadores), então a trilha só ocuparia espaço.
- **`-movflags +faststart`** move o índice do MP4 pro começo do arquivo, senão
  o navegador precisa baixar o vídeo inteiro antes do primeiro frame.
- **`-preset slow` / `-cpu-used 3`** deixam o encoder demorar mais pra espremer
  melhor. Só custa tempo de quem gera, uma vez.

## Conferindo o resultado

**Olhe a textura, no tamanho em que ela vai ser vista.** É o teste que vale.

Pro arquivo de desktop, recorte 1:1 (o vídeo aparece quase em tamanho real):

```sh
ffmpeg -i ENTRADA.mp4 -frames:v 1 -vf "crop=560:400:640:400" orig.jpg
ffmpeg -i public/hero/filme-1080.mp4 -frames:v 1 -vf "crop=560:400:640:400" novo.jpg
```

Pro arquivo de celular, reduza pra largura real de exibição antes de comparar —
julgar em 1:1 aqui condena um arquivo que na tela fica perfeito:

```sh
ffmpeg -i ENTRADA.mp4 -frames:v 1 -vf "scale=390:-2" orig-mob.jpg
ffmpeg -i public/hero/filme-720.mp4 -frames:v 1 -vf "scale=390:-2" novo-mob.jpg
```

O granulado do couro tem que continuar visível no de desktop. Se virou uma
superfície lisa, o CRF está alto demais.

Existe também a medida objetiva, útil **só pro H.264** (mire acima de 0,99):

```sh
ffmpeg -i public/hero/filme-1080.mp4 -i ENTRADA.mp4 -lavfi ssim -f null -
```

Não use SSIM pra julgar o WebM: o VP9 reordena quadros internamente e a
comparação sai desalinhada, marcando ~0,98 mesmo quando a imagem está ótima.
No VP9, confie no recorte.

## Alvo de peso

Referência da versão atual, vinda de 13,5 MB:

| | WebM | MP4 |
| --- | --- | --- |
| 1080p | 2,79 MB | 3,68 MB |
| 720p | 0,67 MB | 0,82 MB |

## Depois de gerar

Se o nome mudar, aponte o novo em `lib/content/hero-slides.ts` — o campo
`video` vai **sem sufixo** (`/hero/filme`), porque o componente monta os quatro
arquivos a partir dele.
