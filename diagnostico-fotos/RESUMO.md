# Diagnóstico: fotos de produto cortadas — unibolsas.store

Medido em 28/11/2026 com Playwright no site público, em dois tamanhos: celular (390×844, tela 2x) e computador (1440×900).
As medições completas estão em `relatorio.json` (campo `medicoes`, uma linha por `<img>`).
Fotos de produto medidas: Supabase `/products/` e `/lookbook/bolsa-XX.webp`. Quase todas são quadradas (440 de 448 têm proporção 1:1).
"Some" é a parte da área da foto que fica fora do quadro, já contando object-fit, object-position e transform.

## Onde está cortando

| # | Onde | Seletor do quadro | Tela | Quanto some | Por quê | Produtos |
|---|------|-------------------|------|-------------|---------|----------|
| 1 | **Lookbook (trilho lateral "Look 01…10")** | `.uni-lb-foto` (img em `.uni-lb-foto img`) | só computador | **52,9%: 26,5% em cima e 26,5% embaixo** | `object-fit: cover` (globals.css ~l.4850) com foto 900×900 num quadro de 289×136 (proporção 2,13). O quadro é `flex:1` e a altura dele depende da altura da janela. | Todas as 10 do lookbook: Verniz com Fivela, Lunéa, Palha Trançada, Grande de Ombro Alça Trançada, Missdong, Véloa Bag, Viagem Grande Multiuso, Fitness P, Praia Transparente, Mochila Feminina Pequena |
| 2 | **Miniaturas da gaveta do pedido** | `.uni-pedido-thumb` (img em `.uni-pedido-thumb img`) | celular e computador | **18,2%: 9,1% em cada lateral** | `object-fit: cover` (globals.css ~l.3788) com foto quadrada num quadro de 72×88 (proporção 0,82) | Todos os itens adicionados (testados: Bolsa Pequena Duas Alças, Lunéa) |
| 3 | Cards da home (Destaques e Catálogo) | `.uni-card-img-wrap` (img em `.uni-card-photo-layer img.uni-card-img`) | celular e computador | 3,9% (≈1% em cada lado); 2% (≈1% em cima e embaixo) nas 4 fotos em pé | A foto fica inteira (`object-fit: contain`), mas o `transform: … scale(1.02)` de ProductCard.tsx (~l.177, efeito parallax) aumenta o img e o `overflow:hidden` do quadro corta a borda | Todos: 6 dos Destaques e 36 do Catálogo |

O item 3 é pequeno, mas é sistemático: as bolsas que encostam na borda da foto perdem cerca de 1% de cada lado.

## Onde NÃO corta (ok)
- Página de produto: galeria `.uni-pdp-slide img`, miniaturas `.uni-pdp-gallery-thumb img` e relacionados `.uni-pdp-related-img-wrap img`, todas com `contain`. 6 produtos testados, 0 cortes.
- Visualização rápida (botão "→ Ver detalhes" nos cards): `.uni-qv-slide` e `.uni-qv-thumb`, com `contain`. 2 produtos testados, 0 cortes. No celular as miniaturas `.uni-qv-thumb` ficam escondidas.
- Lookbook no celular (`.uni-lbm-mini`, `.uni-lb-m`): `contain`, 0 cortes.
- `.uni-photo-backdrop` (fundo desfocado atrás da foto) usa `cover` de propósito. Não conta como corte.

## Achado à parte: página de produto quebrou no teste
No Chromium deste ambiente, toda página `/produtos/...` mostrou "This page couldn't load" (ChunkLoadError).
O arquivo `_next/static/chunks/app/(public)/produtos/%5Bslug%5D/page-b2326e98eee00318.js` voltou **404 do CDN Hostinger (hcdn)**, com content-type `text/plain`.
O mesmo endereço via curl volta 200 (testei com os mesmos cabeçalhos do navegador), então a causa não está confirmada. Pode ser algo deste ambiente de teste ou do cache do CDN.
Para medir as páginas, o teste entregou esse arquivo via curl, sem mexer no site. **Vale abrir uma página de produto num celular real para conferir.**

## Screenshots
- Cortes: `computador-lookbook-uni-lb-card-CORTADA.png` (alça e base da bolsa fora do quadro), `computador-lookbook-secao-uni-lb.png`, `celular-gaveta-miniatura-CORTADA.png`, `computador-gaveta-miniatura-CORTADA.png`, `*-gaveta-pedido.png`
- 3 cards da home: `celular-home-card-{1,2,3}-*.png`, `computador-home-card-{1,2,3}-*.png`
- Referência (sem corte): `*-quickview-*.png`, `*-produto-{1,2}-topo.png`, `celular-lookbook-uni-lbm-card.png`, `computador-home-uni-lb-card.png`, `computador-home-uni-lb-chamada-fotos.png`
