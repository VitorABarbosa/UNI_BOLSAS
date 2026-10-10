import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

// Shopee serves listing photos from its own CDN; the admin panel renders them
// via next/image, so the host has to be allow-listed.
const shopeeImagePattern = {
  protocol: 'https',
  hostname: '**.susercontent.com',
} as const;

/**
 * Cabeçalhos de segurança. O Next não manda nenhum por padrão.
 *
 * Nada aqui muda o cadeado do navegador — isso é o certificado, que vive no
 * painel da hospedagem. O que estes cabeçalhos fazem é endurecer o site
 * DEPOIS que ele já atende em HTTPS.
 */
const SEGURANCA = [
  {
    /**
     * HSTS: o navegador passa a usar HTTPS neste domínio sem nem tentar
     * `http://`, inclusive na primeira visita depois de ter vindo uma vez.
     * Fecha a janela em que alguém numa rede pública poderia interceptar o
     * acesso antes do redirecionamento acontecer.
     *
     * Deliberadamente SEM `includeSubDomains` e SEM `preload`:
     * - `includeSubDomains` obrigaria HTTPS em todo subdomínio; basta um sem
     *   certificado pra ele sumir do ar.
     * - `preload` grava o domínio numa lista embutida nos navegadores, e sair
     *   dela leva meses. Não é decisão pra tomar de passagem.
     *
     * O custo honesto: se o certificado vencer, o navegador recusa o site em
     * vez de mostrar um aviso que dá pra ignorar. A Hostinger renova o
     * Let's Encrypt sozinha, mas vale saber. Pra desfazer, troque o max-age
     * por 0 e publique — os navegadores esquecem na visita seguinte.
     */
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000',
  },
  {
    /* Impede o navegador de "adivinhar" o tipo de um arquivo e executar como
       script algo que foi servido como imagem — o caminho clássico pra
       transformar um upload de foto em código rodando na página. */
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    /* Clickjacking: ninguém pode embutir o site num iframe pra sobrepor
       botões invisíveis em cima dos nossos. (Não afeta o mapa do Google que
       NÓS embutimos — aqui quem é embutido é o nosso site.) */
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    /* O endereço completo da página só é revelado pra nós mesmos; pra fora
       vai só o domínio. Evita vazar caminho de página numa requisição a
       terceiro. */
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    /* O site não usa câmera, microfone nem localização. Declarar isso impede
       que um script embutido peça — e tira o susto do cliente. */
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: SEGURANCA }];
  },
  experimental: {
    // The spreadsheet importer round-trips the parsed rows through Server
    // Actions; the 1MB default is not enough for a few hundred products.
    serverActions: { bodySizeLimit: '10mb' },
  },
  images: {
    // O Next 16 recusa (HTTP 400) qualquer `quality` fora desta lista. 75 é o
    // padrão usado no resto do site; 90 é o das fotos de produto.
    qualities: [75, 90],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/products/**',
          },
          shopeeImagePattern,
        ]
      : [shopeeImagePattern],
  },
};

export default nextConfig;
