import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Uni Bolsas — Atacado e Varejo · Brás SP',
  description:
    'Fabricante de bolsas no Brás · São Paulo. Atendimento atacado e varejo via WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
