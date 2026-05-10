'use client';

import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  reorderImages,
  deleteImage,
  updateImageAlt,
} from '@/app/admin/_actions/images';
import { ImageThumb } from './ImageThumb';
import type { ImageRow } from './index';

export function ImageGrid({
  productId,
  colorId,
  images,
  onDeleted,
  onAltUpdated,
  onReordered,
}: {
  productId: string;
  colorId: string | null;
  images: ImageRow[];
  onDeleted: (id: string) => void;
  onAltUpdated: (id: string, alt: string | null) => void;
  onReordered: (newOrderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [confirmDelete, setConfirmDelete] = useState<ImageRow | null>(null);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = images.findIndex((i) => i.id === active.id);
    const newIdx = images.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(images, oldIdx, newIdx);
    const previousOrder = images.map((i) => i.id);
    onReordered(next.map((i) => i.id));
    const res = await reorderImages({
      product_id: productId,
      color_id: colorId,
      ordered_ids: next.map((i) => i.id),
    });
    if (!res.ok) {
      toast.error(res.error);
      onReordered(previousOrder); // hard revert
    }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    const res = await deleteImage(confirmDelete.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onDeleted(confirmDelete.id);
    setConfirmDelete(null);
    toast.success('Imagem excluída');
  };

  const handleAltSave = async (id: string, alt: string | null) => {
    const res = await updateImageAlt({ id, alt });
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    onAltUpdated(id, alt);
    toast.success('Alt atualizado');
    return true;
  };

  if (images.length === 0) {
    return (
      <div className="rounded-md border border-whisper bg-bone-light px-4 py-8 text-center text-sm text-stone">
        Nenhuma imagem ainda. Use o dropzone acima.
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <ImageThumb
                key={img.id}
                image={img}
                onDelete={(row) => setConfirmDelete(row)}
                onSaveAlt={handleAltSave}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Excluir imagem"
        description="Excluir esta imagem? O arquivo será removido do bucket."
        confirmLabel="Excluir"
        destructive
        onConfirm={performDelete}
      />
    </>
  );
}
