'use client';

import { useState, useTransition } from 'react';
import { mandarResumoAgora } from '@/app/admin/_actions/notificacoes';

/** Manda o resumo do dia ou da semana na hora, pra ver como ele chega. */
export function ResumoAgora() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pendente, start] = useTransition();
  const mandar = (tipo: 'dia' | 'semana') =>
    start(async () => {
      const r = await mandarResumoAgora(tipo);
      setMsg(r.ok ? 'Resumo enviado (celulares ativados e e-mail da loja).' : (r.erro ?? 'Não deu certo.'));
    });
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" disabled={pendente} onClick={() => mandar('dia')} className="rounded-md border bg-white px-3 py-2 disabled:opacity-60">
        Mandar o resumo de hoje agora
      </button>
      <button type="button" disabled={pendente} onClick={() => mandar('semana')} className="rounded-md border bg-white px-3 py-2 disabled:opacity-60">
        Mandar o da semana agora
      </button>
      {msg && <span className="w-full text-stone-600">{msg}</span>}
    </div>
  );
}
