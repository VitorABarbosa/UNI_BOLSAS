import type { ReactNode } from 'react';
import { PromoStrip } from '@/components/public/shell/PromoStrip';
import { Header } from '@/components/public/shell/Header';
import { Footer } from '@/components/public/shell/Footer';
import { FloatingWA } from '@/components/public/shell/FloatingWA';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PromoStrip />
      <Header />
      <main id="top">{children}</main>
      <Footer />
      <FloatingWA />
    </>
  );
}
