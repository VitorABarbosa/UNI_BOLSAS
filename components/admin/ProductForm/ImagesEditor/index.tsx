'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageDropzone } from './ImageDropzone';
import { ImageGrid } from './ImageGrid';

export type ImageRow = {
  id: string;
  product_id: string;
  color_id: string | null;
  storage_path: string;
  alt: string | null;
  sort_order: number;
};

export type ColorTabInfo = {
  id: string;
  name: string;
  hex: string;
};

type Scope = { type: 'generic' } | { type: 'color'; id: string };

export function ImagesEditor({
  productId,
  colors,
  initial,
}: {
  productId: string;
  colors: ColorTabInfo[];
  initial: ImageRow[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<ImageRow[]>(
    [...initial].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [scope, setScope] = useState<Scope>({ type: 'generic' });

  // Defensive: if active color tab disappears (color was deleted), fall back to generic.
  useEffect(() => {
    if (scope.type === 'color' && !colors.find((c) => c.id === scope.id)) {
      setScope({ type: 'generic' });
    }
  }, [colors, scope]);

  const inScope = (img: ImageRow) =>
    scope.type === 'generic' ? img.color_id === null : img.color_id === scope.id;

  const scopedImages = images
    .filter(inScope)
    .sort((a, b) => a.sort_order - b.sort_order);

  const tabValue = scope.type === 'generic' ? 'generic' : `color:${scope.id}`;

  const handleTabChange = (v: unknown) => {
    const value = String(v ?? '');
    if (value === 'generic') setScope({ type: 'generic' });
    else if (value.startsWith('color:'))
      setScope({ type: 'color', id: value.slice(6) });
  };

  const onUploaded = (newRow: ImageRow) => {
    setImages((prev) => [...prev, newRow]);
  };

  const onDeleted = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  };

  const onAltUpdated = (id: string, alt: string | null) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, alt } : i)));
  };

  const onReordered = (newOrderedIds: string[]) => {
    setImages((prev) => {
      const within = prev.filter(inScope);
      const outside = prev.filter((i) => !inScope(i));
      const byId = new Map(within.map((i) => [i.id, i]));
      const reordered = newOrderedIds
        .map((id, idx) => {
          const found = byId.get(id);
          return found ? { ...found, sort_order: idx } : null;
        })
        .filter((x): x is ImageRow => x !== null);
      return [...outside, ...reordered];
    });
  };

  const countFor = (s: Scope) =>
    images.filter((i) =>
      s.type === 'generic' ? i.color_id === null : i.color_id === s.id,
    ).length;

  return (
    <Tabs value={tabValue} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="generic">
          Genéricas
          <span className="ml-1.5 text-xs text-stone">
            ({countFor({ type: 'generic' })})
          </span>
        </TabsTrigger>
        {colors.map((c) => (
          <TabsTrigger key={c.id} value={`color:${c.id}`}>
            <span
              className="mr-1.5 inline-block h-3 w-3 rounded-full border border-whisper"
              style={{ backgroundColor: c.hex }}
              aria-hidden
            />
            {c.name}
            <span className="ml-1.5 text-xs text-stone">
              ({countFor({ type: 'color', id: c.id })})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={tabValue} className="space-y-4">
        <ImageDropzone
          productId={productId}
          colorId={scope.type === 'generic' ? null : scope.id}
          scopeLabel={
            scope.type === 'generic'
              ? 'genéricas'
              : (colors.find((c) => c.id === scope.id)?.name ?? 'cor')
          }
          onUploaded={onUploaded}
        />
        <ImageGrid
          productId={productId}
          colorId={scope.type === 'generic' ? null : scope.id}
          images={scopedImages}
          onDeleted={onDeleted}
          onAltUpdated={onAltUpdated}
          onReordered={onReordered}
        />
      </TabsContent>
    </Tabs>
  );
}
