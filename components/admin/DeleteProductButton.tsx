'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteProduct } from '@/app/admin/_actions/products';

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const performDelete = () =>
    new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await deleteProduct(id);
        if (!res.ok) {
          toast.error(res.error);
          resolve();
          return;
        }
        toast.success('Produto excluído');
        setOpen(false);
        router.push('/admin/produtos');
        router.refresh();
        resolve();
      });
    });

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-1 h-4 w-4" />
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir produto"
        description={
          <>
            Excluir <strong>“{name}”</strong> e todas as suas imagens?
          </>
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={performDelete}
      />
    </>
  );
}
