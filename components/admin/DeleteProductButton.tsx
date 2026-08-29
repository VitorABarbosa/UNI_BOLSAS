'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteProduct, setProductActive } from '@/app/admin/_actions/products';

/**
 * Duas ações com consequências bem diferentes, e a diferença precisa estar na
 * tela: "remover do site" guarda a decisão (a importação pula o produto pelo
 * nome), enquanto "excluir" apaga essa memória e a próxima importação recria o
 * produto do zero. O caminho seguro é o botão principal; o definitivo fica
 * atrás de um aviso que diz exatamente isso.
 */
export function DeleteProductButton({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await fn();
        if (!res.ok) {
          toast.error(res.error ?? 'Não deu certo');
          resolve();
          return;
        }
        toast.success(done);
        setConfirmRemove(false);
        setConfirmDelete(false);
        router.refresh();
        resolve();
      });
    });

  return (
    <>
      {active ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmRemove(true)}
        >
          <EyeOff className="mr-1 h-4 w-4" />
          Remover do site
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            run(
              () => setProductActive(id, true),
              'Produto de volta no site',
            )
          }
        >
          Voltar pro site
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        Excluir
      </Button>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remover do site"
        description={
          <>
            <strong>“{name}”</strong> sai do catálogo e deixa de aparecer pra
            quem visita. As fotos e os dados ficam guardados, e a importação da
            planilha vai reconhecê-lo e pular — ele não volta sozinho. Dá pra
            trazer de volta quando quiser.
          </>
        }
        confirmLabel="Remover do site"
        onConfirm={() =>
          run(() => setProductActive(id, false), 'Produto removido do site')
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir definitivamente"
        description={
          <>
            Apagar <strong>“{name}”</strong> e todas as suas fotos, sem volta.
            <br />
            <br />
            Atenção: se este produto ainda estiver na planilha da Shopee, a
            próxima importação vai <strong>criá-lo de novo</strong> — porque
            some do banco a informação de que ele já existiu. Para tirá-lo do
            site de forma permanente, use <strong>Remover do site</strong>.
          </>
        }
        confirmLabel="Excluir mesmo assim"
        destructive
        onConfirm={() => run(() => deleteProduct(id), 'Produto excluído')}
      />
    </>
  );
}
