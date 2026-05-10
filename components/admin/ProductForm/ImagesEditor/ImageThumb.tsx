'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { publicImageUrl } from '@/lib/supabase/image-url';
import type { ImageRow } from './index';

export function ImageThumb({
  image,
  onDelete,
  onSaveAlt,
}: {
  image: ImageRow;
  onDelete: (row: ImageRow) => void;
  onSaveAlt: (id: string, alt: string | null) => Promise<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const [altOpen, setAltOpen] = useState(false);
  const [draftAlt, setDraftAlt] = useState(image.alt ?? '');
  const [saving, setSaving] = useState(false);

  const openAlt = () => {
    setDraftAlt(image.alt ?? '');
    setAltOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const trimmed = draftAlt.trim();
    const ok = await onSaveAlt(image.id, trimmed === '' ? null : trimmed);
    setSaving(false);
    if (ok) setAltOpen(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative aspect-square overflow-hidden rounded-md border border-whisper bg-pearl"
      >
        <Image
          src={publicImageUrl(image.storage_path)}
          alt={image.alt ?? ''}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover"
        />
        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex justify-between">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="pointer-events-auto cursor-grab touch-none rounded-sm bg-pearl/90 p-1 text-stone hover:text-ink"
              aria-label="Reordenar"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(image)}
              className="pointer-events-auto rounded-sm bg-pearl/90 p-1 text-wine hover:bg-wine/10"
              aria-label="Excluir imagem"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={openAlt}
            className="pointer-events-auto self-stretch rounded-sm bg-pearl/90 px-2 py-1 text-left text-xs text-stone hover:text-ink"
          >
            <Pencil className="mr-1 inline-block h-3 w-3" />
            {image.alt ? (
              <span className="line-clamp-1">{image.alt}</span>
            ) : (
              <span>Adicionar alt</span>
            )}
          </button>
        </div>
      </div>

      <Dialog open={altOpen} onOpenChange={setAltOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Texto alternativo</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftAlt}
            onChange={(e) => setDraftAlt(e.target.value)}
            rows={3}
            placeholder="Descreva a imagem para acessibilidade…"
            maxLength={200}
          />
          <p className="text-xs text-stone">{draftAlt.length} / 200</p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAltOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
