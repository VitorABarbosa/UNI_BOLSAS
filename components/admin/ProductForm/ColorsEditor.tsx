'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  upsertColor,
  deleteColor,
  reorderColors,
} from '@/app/admin/_actions/colors';

export type ColorRow = {
  id: string;
  name: string;
  hex: string;
  accent_hex: string | null;
  sort_order: number;
  image_count: number;
};

export function ColorsEditor({
  productId,
  initial,
}: {
  productId: string;
  initial: ColorRow[];
}) {
  const router = useRouter();
  const [colors, setColors] = useState<ColorRow[]>(
    [...initial].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<ColorRow | null>(null);

  // Add new color form
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#000000');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persist = (
    row: ColorRow,
    field: 'name' | 'hex' | 'accent_hex',
    nextValue: string | null,
  ) => {
    if (row[field] === nextValue) return;
    const updated = { ...row, [field]: nextValue } as ColorRow;
    setColors((prev) => prev.map((c) => (c.id === row.id ? updated : c)));
    startTransition(async () => {
      const res = await upsertColor(productId, {
        id: row.id,
        name: updated.name,
        hex: updated.hex,
        accent_hex: updated.accent_hex,
        sort_order: row.sort_order,
      });
      if (!res.ok) {
        toast.error(res.error);
        setColors((prev) => prev.map((c) => (c.id === row.id ? row : c)));
      } else {
        toast.success('Cor atualizada');
      }
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = colors.findIndex((c) => c.id === active.id);
    const newIdx = colors.findIndex((c) => c.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(colors, oldIdx, newIdx).map((c, i) => ({
      ...c,
      sort_order: i,
    }));
    setColors(next);
    startTransition(async () => {
      const res = await reorderColors(
        productId,
        next.map((c) => c.id),
      );
      if (!res.ok) {
        toast.error(res.error);
        setColors(initial.slice().sort((a, b) => a.sort_order - b.sort_order));
      }
    });
  };

  const addNew = () => {
    const name = newName.trim();
    if (!name) return;
    const maxOrder = colors.reduce((m, c) => Math.max(m, c.sort_order), -1);
    startTransition(async () => {
      const res = await upsertColor(productId, {
        name,
        hex: newHex,
        accent_hex: null,
        sort_order: maxOrder + 1,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const newRow: ColorRow = {
        id: res.data.id,
        name,
        hex: newHex,
        accent_hex: null,
        sort_order: maxOrder + 1,
        image_count: 0,
      };
      setColors((prev) => [...prev, newRow]);
      setNewName('');
      setNewHex('#000000');
      toast.success('Cor adicionada');
      router.refresh();
    });
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    const res = await deleteColor(confirmDelete.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setColors((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    setConfirmDelete(null);
    toast.success('Cor excluída');
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={colors.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="rounded-md border border-whisper bg-pearl">
            {colors.map((row) => (
              <ColorRowItem
                key={row.id}
                row={row}
                onPersist={persist}
                onDelete={(r) => setConfirmDelete(r)}
                disabled={pending}
              />
            ))}
            {colors.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-stone">
                Nenhuma cor cadastrada.
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="rounded-md border border-whisper bg-bone-light p-3">
        <p className="mb-2 text-xs font-medium text-stone">Adicionar cor</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addNew();
              }
            }}
            placeholder="Nome (ex: Caramelo)"
            disabled={pending}
            className="max-w-[240px]"
          />
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            disabled={pending}
            className="h-9 w-12 cursor-pointer rounded-sm border border-whisper bg-pearl"
            aria-label="Cor (hex)"
          />
          <Button type="button" onClick={addNew} disabled={pending || !newName.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Excluir cor"
        description={
          confirmDelete ? (
            <>
              Excluir cor <strong>“{confirmDelete.name}”</strong>?
              {confirmDelete.image_count > 0 && (
                <>
                  {' '}
                  Vai apagar{' '}
                  <strong>{confirmDelete.image_count} imagem(ns)</strong>{' '}
                  vinculada(s).
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

function ColorRowItem({
  row,
  onPersist,
  onDelete,
  disabled,
}: {
  row: ColorRow;
  onPersist: (
    row: ColorRow,
    field: 'name' | 'hex' | 'accent_hex',
    value: string | null,
  ) => void;
  onDelete: (row: ColorRow) => void;
  disabled: boolean;
}) {
  const [hasAccent, setHasAccent] = useState(row.accent_hex !== null);
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
        defaultValue={row.name}
        onBlur={(e) => onPersist(row, 'name', e.currentTarget.value)}
        disabled={disabled}
        className="max-w-[200px]"
      />
      <input
        type="color"
        defaultValue={row.hex}
        onBlur={(e) => onPersist(row, 'hex', e.currentTarget.value)}
        disabled={disabled}
        className="h-9 w-12 cursor-pointer rounded-sm border border-whisper bg-pearl"
        aria-label="Hex principal"
      />
      <label className="flex items-center gap-1 text-xs text-stone">
        <input
          type="checkbox"
          checked={hasAccent}
          onChange={(e) => {
            const checked = e.target.checked;
            setHasAccent(checked);
            if (!checked) onPersist(row, 'accent_hex', null);
            else if (!row.accent_hex) onPersist(row, 'accent_hex', '#ffffff');
          }}
          disabled={disabled}
        />
        Bicolor
      </label>
      {hasAccent && (
        <input
          type="color"
          defaultValue={row.accent_hex ?? '#ffffff'}
          onBlur={(e) => onPersist(row, 'accent_hex', e.currentTarget.value)}
          disabled={disabled}
          className="h-9 w-12 cursor-pointer rounded-sm border border-whisper bg-pearl"
          aria-label="Hex accent"
        />
      )}
      <span className="ml-auto text-xs text-stone">
        {row.image_count} img{row.image_count === 1 ? '' : 's'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(row)}
        disabled={disabled}
        aria-label={`Excluir cor ${row.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
