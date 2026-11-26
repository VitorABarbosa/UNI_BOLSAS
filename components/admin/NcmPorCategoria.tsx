'use client';

import { useState, useTransition } from 'react';
import { salvarNcmPorCategoria } from '@/app/admin/_actions/nota';
import type { CategoriaNcm } from '@/lib/automacao/ncm';

const formatar = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.replace(/^(\d{4})(\d{0,2})(\d{0,2}).*$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('.'));
};

/** Um campo de NCM por categoria do catálogo. */
export function NcmPorCategoria({ categorias }: { categorias: CategoriaNcm[] }) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(categorias.map((c) => [c.id, formatar(c.ncm)])),
  );
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await salvarNcmPorCategoria(valores);
          setMsg(r.ok ? { ok: true, texto: 'NCMs salvos.' } : { ok: false, texto: r.erro });
        });
      }}
    >
      <ul className="divide-y rounded-md border">
        {categorias.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <label htmlFor={`ncm-${c.id}`} className="font-medium">
              {c.nome}
            </label>
            <input
              id={`ncm-${c.id}`}
              inputMode="numeric"
              value={valores[c.id] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [c.id]: formatar(e.target.value) }))}
              placeholder="0000.00.00"
              className={`w-36 rounded-md border px-3 py-1.5 font-mono text-sm ${
                (valores[c.id] ?? '').replace(/\D/g, '').length === 8 ? 'border-green-500' : 'border-stone-300'
              }`}
            />
          </li>
        ))}
      </ul>
      <button type="submit" disabled={pendente} className="rounded-md bg-stone-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
        {pendente ? 'Salvando…' : 'Salvar NCMs'}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.texto}</p>}
    </form>
  );
}
