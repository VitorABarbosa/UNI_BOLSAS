import type { Metadata, Viewport } from 'next';

/**
 * O painel pode ser instalado no celular como um app ("Adicionar à tela de
 * início"): abre em tela cheia, com ícone próprio, e recebe notificações.
 */
export const metadata: Metadata = {
  manifest: '/admin.webmanifest',
  appleWebApp: { capable: true, title: 'Uni Painel', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#F4EFE6',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
