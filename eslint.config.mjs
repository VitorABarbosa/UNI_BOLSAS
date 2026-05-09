import nextConfig from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'next-env.d.ts',
      'Claude Design - Reference/**',
      'supabase/seed-assets/**',
      'components/ui/**',
    ],
  },
  ...nextConfig,
  ...nextCoreWebVitals,
];

export default config;
