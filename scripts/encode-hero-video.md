# Como preparar o filme do hero

O vídeo do hero é servido pelo próprio site (`public/hero/`), não por um player
de terceiro. É isso que permite ele começar junto com a página. Em troca, o
arquivo precisa ser preparado à mão — um export direto da câmera ou do editor
tem dezenas de MB e não serve.

O arquivo original que veio do cliente tinha **13,5 MB em HEVC (H.265)**. Além
do peso, HEVC não toca em `<video>` no Chrome da maioria das plataformas: sem
reencodar, o hero fica preto pra boa parte dos visitantes.

## Receita

Requer `ffmpeg`. Trocando `ENTRADA.mp4` pelo arquivo novo:

```sh
# H.264 — toca em qualquer navegador. É o formato de segurança.
ffmpeg -i ENTRADA.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow \
  -movflags +faststart -g 48 public/hero/filme.mp4

# WebM/VP9 — menor; os navegadores que aceitam pegam este.
ffmpeg -i ENTRADA.mp4 -an -vf "scale=1280:720:flags=lanczos" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 \
  public/hero/filme.webm

# Capa: o frame 0, o mesmo instante que o vídeo mostra ao começar.
ffmpeg -i ENTRADA.mp4 -frames:v 1 -q:v 3 public/hero/filme-capa.jpg
```

Por que cada pedaço:

- **`-an`** joga fora o áudio. O vídeo é mudo por natureza (autoplay com som é
  bloqueado pelos navegadores), então a trilha só ocuparia espaço.
- **`720p`** é suficiente: o quadro do hero tem ~1300px de largura e o vídeo é
  cortado em `cover`. Guardar 1080p aqui dobra o peso sem ganho visível.
- **`-movflags +faststart`** move o índice do MP4 pro começo do arquivo, senão
  o navegador precisa baixar o vídeo inteiro antes do primeiro frame.
- **`-crf 27` / `-crf 36`** são os controles de qualidade. Número menor = mais
  qualidade e mais peso. Vale conferir o resultado antes de subir.

## Alvo de peso

Mire em **menos de 1 MB por arquivo**. A versão atual ficou em 757 KB (MP4) e
641 KB (WebM), vindo de 13,5 MB.

## Depois de gerar

Se o nome mudar, aponte o novo em `lib/content/hero-slides.ts` — o campo
`video` vai **sem extensão** (`/hero/filme`), porque o componente monta o
`.webm` e o `.mp4` a partir dele.
