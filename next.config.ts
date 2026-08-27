import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

// Shopee serves listing photos from its own CDN; the admin panel renders them
// via next/image, so the host has to be allow-listed.
const shopeeImagePattern = {
  protocol: 'https',
  hostname: '**.susercontent.com',
} as const;

// Poster do vídeo do hero: o thumbnail vem do CDN de imagens do Vimeo e é
// servido pelo next/image (ver lib/vimeo.ts e HeroCarousel).
const vimeoThumbPattern = {
  protocol: 'https',
  hostname: 'i.vimeocdn.com',
  pathname: '/video/**',
} as const;

const nextConfig: NextConfig = {
  typedRoutes: true,
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
          vimeoThumbPattern,
        ]
      : [shopeeImagePattern, vimeoThumbPattern],
  },
};

export default nextConfig;
