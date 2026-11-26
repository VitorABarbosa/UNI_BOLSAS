import type { Metadata, Viewport } from 'next';
import { DM_Sans, DM_Mono, Fraunces } from 'next/font/google';
import { SITE_URL } from '@/lib/seo';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz'],
});

// O CSS usa 'DM Mono' em preços, specs e labels técnicos. Sem carregar a
// família aqui, o navegador caía no monospace do sistema (Courier no iOS).
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
});

import { DESCRICAO_INICIO, PALAVRAS_CHAVE, TITULO_INICIO } from '@/lib/content/vitrine';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Deixa a página desenhar sob o notch/barra de gestos; o CSS compensa com
  // env(safe-area-inset-*) nos elementos fixos (header, menu, botão flutuante).
  viewportFit: 'cover',
  themeColor: '#F4EFE6',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITULO_INICIO,
  description: DESCRICAO_INICIO,
  keywords: PALAVRAS_CHAVE,
  applicationName: 'Uni Bolsas',
  formatDetection: { telephone: false },
  // Código de verificação do Google (Merchant Center / Search Console): a
  // variável GOOGLE_SITE_VERIFICATION na Hostinger vira a meta tag.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION.replace(/^.*content="([^"]+)".*$/s, '$1').trim() } }
    : {}),
};

/**
 * Marca o documento como "tem JS" antes da primeira pintura.
 *
 * As animações de entrada (`Reveal`) só devem esconder o conteúdo quando há JS
 * pra revelá-lo depois. Sem isso, um celular com JS lento mostrava a página em
 * branco até a hidratação — e com JS desligado o conteúdo nunca aparecia.
 */
const JS_READY = `document.documentElement.classList.add('js-ready')`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${fraunces.variable} ${dmMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_READY }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
