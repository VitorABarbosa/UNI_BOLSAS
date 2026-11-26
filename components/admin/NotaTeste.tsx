'use client';

import { useState, useTransition } from 'react';
import { emitirNotaDeTeste, type ResultadoTeste } from '@/app/admin/_actions/nota';

/** Botão "Emitir nota de teste" (homologação, sem valor fiscal). */
export function NotaTeste() {
  const [pendente, start] = useTransition();
  const [r, setR] = useState<ResultadoTeste | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pendente}
        onClick={() => start(async () => setR(await emitirNotaDeTeste()))}
        className="rounded-md bg-stone-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {pendente ? 'Emitindo… (pode levar até 30 segundos)' : 'Emitir nota de teste'}
      </button>
      {r?.ok && (
        <p className="text-sm text-green-700">
          ✓ Nota de teste nº {r.numero} autorizada pela SEFAZ.{' '}
          <a className="underline" href={`/api/nota/${r.ref}`} target="_blank" rel="noopener noreferrer">
            Ver o PDF
          </a>
          . Está tudo certo para ligar as notas de verdade.
        </p>
      )}
      {r && !r.ok && <p className="text-sm text-red-700">✗ {r.erro}</p>}
    </div>
  );
}
