import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

// Shopee serves listing photos from its own CDN; the admin panel renders them
// via next/image, so the host has to be allow-listed.
const shopeeImagePattern = {
  protocol: 'https',
  hostname: '**.susercontent.com',
} as const;

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
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
