import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Caixa } from '@/components/public/conta/Caixa';
import { FormNovaSenha } from '@/components/public/conta/Formularios';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nova senha · Uni Bolsas' };

export default async function NovaSenhaPage() {
  const { data } = await (await createClient()).auth.getUser();
  const liberado = !!data.user && (await cookies()).get('uni-redefinir')?.value === data.user.id;
  return (
    <Caixa rotulo="Sua conta" titulo={<>Nova senha</>} sub={liberado ? `Para ${data.user!.email}` : undefined}>
      {liberado ? (
        <FormNovaSenha />
      ) : (
        <div className="uni-conta-feito">
          <p>O tempo para trocar a senha acabou ou o link não foi aberto neste aparelho.</p>
          <Link className="uni-conta-btn" href="/conta/esqueci-senha">
            Pedir um novo link
          </Link>
        </div>
      )}
    </Caixa>
  );
}
