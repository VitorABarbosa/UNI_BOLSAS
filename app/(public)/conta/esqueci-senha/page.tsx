import type { Metadata } from 'next';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormEsqueci } from '@/components/public/conta/Formularios';

export const metadata: Metadata = { title: 'Esqueci minha senha · Uni Bolsas' };

export default function EsqueciPage() {
  return (
    <Caixa rotulo="Sua conta" titulo={<>Esqueci a senha</>} sub="Digite o e-mail da conta. Mandamos um link para você criar uma senha nova.">
      <FormEsqueci />
    </Caixa>
  );
}
