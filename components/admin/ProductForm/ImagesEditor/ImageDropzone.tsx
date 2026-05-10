'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadProductImage } from '@/lib/upload';
import { insertImage } from '@/app/admin/_actions/images';
import type { ImageRow } from './index';

const ACCEPT = {
  'image/webp': [],
  'image/jpeg': [],
  'image/png': [],
  'image/svg+xml': [],
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PARALLEL = 4;

export function ImageDropzone({
  productId,
  colorId,
  scopeLabel,
  onUploaded,
}: {
  productId: string;
  colorId: string | null;
  scopeLabel: string;
  onUploaded: (row: ImageRow) => void;
}) {
  const [uploadCount, setUploadCount] = useState(0);

  const handleDrop = useCallback(
    async (files: File[]) => {
      const queue = [...files];
      const inFlight: Promise<void>[] = [];

      const process = async (file: File) => {
        setUploadCount((c) => c + 1);
        try {
          const path = await uploadProductImage(file, productId);
          const res = await insertImage({
            product_id: productId,
            color_id: colorId,
            storage_path: path,
            alt: null,
            sort_order: 0, // server overrides with max+1 within scope
          });
          if (!res.ok) {
            toast.error(`${file.name}: ${res.error}`);
            return;
          }
          onUploaded({
            id: res.data.id,
            product_id: productId,
            color_id: colorId,
            storage_path: path,
            alt: null,
            sort_order: res.data.sort_order,
          });
          toast.success(`${file.name} enviada`);
        } catch (err) {
          toast.error(
            `${file.name}: ${err instanceof Error ? err.message : 'falha no upload'}`,
          );
        } finally {
          setUploadCount((c) => c - 1);
        }
      };

      while (queue.length > 0) {
        while (inFlight.length < MAX_PARALLEL && queue.length > 0) {
          const file = queue.shift()!;
          const p = process(file).finally(() => {
            const idx = inFlight.indexOf(p);
            if (idx >= 0) inFlight.splice(idx, 1);
          });
          inFlight.push(p);
        }
        if (inFlight.length > 0) await Promise.race(inFlight);
      }
      await Promise.all(inFlight);
    },
    [productId, colorId, onUploaded],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach((rej) => {
      const code = rej.errors[0]?.code;
      const reason =
        code === 'file-too-large'
          ? 'arquivo > 5MB'
          : code === 'file-invalid-type'
            ? 'tipo não aceito'
            : 'arquivo inválido';
      toast.error(`${rej.file.name}: ${reason}`);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    onDrop: handleDrop,
    onDropRejected,
  });

  // Surface a friendlier blocking notice if user navigates away while uploads are pending.
  useEffect(() => {
    if (uploadCount === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploadCount]);

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-sm transition-colors ${
        isDragActive
          ? 'border-leather bg-leather/5 text-ink'
          : 'border-whisper bg-bone-light text-stone hover:border-leather hover:text-ink'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-5 w-5" />
      {isDragActive ? (
        <p>Solte aqui…</p>
      ) : (
        <>
          <p>Arraste imagens ou clique pra escolher</p>
          <p className="text-xs">
            Escopo: <strong>{scopeLabel}</strong> · webp/jpg/png/svg até 5MB
          </p>
        </>
      )}
      {uploadCount > 0 && (
        <p className="text-xs text-leather">{uploadCount} enviando…</p>
      )}
    </div>
  );
}
