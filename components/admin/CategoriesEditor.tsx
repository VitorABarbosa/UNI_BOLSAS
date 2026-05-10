'use client';

import { useState, useTransition } from 'react';
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from './ConfirmDialog';
import { slugify } from '@/lib/slug';
import {
  upsertCategory,
  deleteCategory,
  reorderCategories,
} from '@/app/admin/_actions/categories';

type Row = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  product_count: number;
};

export function CategoriesEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [newLabel, setNewLabel] = useState('');
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{
    id: string;
    label: string;
    productCount: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistFieldChange = (
    row: Row,
    field: 'label' | 'slug',
    nextValue: string,
  ) => {
    if (row[field] === nextValue) return;
    const updated = { ...row, [field]: nextValue };
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    startTransition(async () => {
      const res = await upsertCategory({
        id: row.id,
        label: updated.label,
        slug: updated.slug,
        sort_order: row.sort_order,
      });
      if (!res.ok) {
        toast.error(res.error);
        setRows((prev) => prev.map((r) => (r.id === row.id ? row : r))); // revert
      } else {
        toast.success('Categoria atualizada');
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({
      ...r,
      sort_order: i,
    }));
    setRows(next);
    startTransition(async () => {
      const res = await reorderCategories(next.map((r) => r.id));
      if (!res.ok) {
        toast.error(res.error);
        setRows(initial); // hard revert; ideally refetch from server
      }
    });
  };

  const addNew = () => {
    const label = newLabel.trim();
    if (!label) return;
    const slug = slugify(label);
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), -1);
    startTransition(async () => {
      const res = await upsertCategory({ label, slug, sort_order: maxOrder + 1 });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const newRow: Row = {
        id: res.data.id,
        slug,
        label,
        sort_order: maxOrder + 1,
        product_count: 0,
      };
      setRows((prev) => [...prev, newRow]);
      setNewLabel('');
      toast.success('Categoria criada');
    });
  };

  const handleDelete = (row: Row) => {
    setConfirm({ id: row.id, label: row.label, productCount: row.product_count });
  };

  const performDelete = async () => {
    if (!confirm) return;
    const res = await deleteCategory(confirm.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== confirm.id));
    toast.success('Categoria excluída');
    setConfirm(null);
  };

  return (
    <div className="space-y-4 p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="rounded-md border border-whisper bg-pearl">
            {rows.map((row) => (
              <CategoryRow
                key={row.id}
                row={row}
                onPersist={persistFieldChange}
                onDelete={handleDelete}
                disabled={pending}
              />
            ))}
            {rows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-stone">
                Nenhuma categoria.
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNew();
            }
          }}
          placeholder="Nova categoria…"
          disabled={pending}
        />
        <Button type="button" onClick={addNew} disabled={pending || !newLabel.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Excluir categoria"
        description={
          confirm ? (
            <>
              Excluir <strong>“{confirm.label}”</strong>?
              {confirm.productCount > 0 && (
                <>
                  {' '}
                  Vai apagar <strong>{confirm.productCount} produto(s)</strong> e suas
                  imagens junto.
                </>
              )}
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={performDelete}
      />
    </div>
  );
}

function CategoryRow({
  row,
  onPersist,
  onDelete,
  disabled,
}: {
  row: Row;
  onPersist: (row: Row, field: 'label' | 'slug', nextValue: string) => void;
  onDelete: (row: Row) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border-b border-whisper px-3 py-2 last:border-b-0"
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-stone hover:text-ink"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        defaultValue={row.label}
        onBlur={(e) => onPersist(row, 'label', e.currentTarget.value)}
        disabled={disabled}
        className="max-w-[280px]"
      />
      <Input
        defaultValue={row.slug}
        onBlur={(e) => onPersist(row, 'slug', e.currentTarget.value)}
        disabled={disabled}
        className="max-w-[200px] font-mono text-xs"
      />
      <span className="ml-auto text-xs text-stone">
        {row.product_count} produto{row.product_count === 1 ? '' : 's'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(row)}
        disabled={disabled}
        aria-label={`Excluir ${row.label}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
