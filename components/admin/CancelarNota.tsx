'use client';

import { useState, useTransition } from 'react';
import { cancelarNotaDoPedido } from '@/app/admin/_actions/pedidos';

/** Cancelar a nota (a SEFAZ aceita em até 24 h depois de emitida). */
export function CancelarNota({ refPedido, cancelada }: { refPedido: string; cancelada: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  if (cancelada) return <p className="text-xs font-medium text-red-700">Nota cancelada.</p>;
  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-xs text-red-700 underline">
        Cancelar a nota
      </button>
    );
  }
  return (
    <form
      className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm('Cancelar esta nota fiscal na SEFAZ? Não dá para desfazer.')) return;
        start(async () => {
          const r = await cancelarNotaDoPedido(refPedido, motivo);
          setMsg(r.ok ? { ok: true, texto: 'Nota cancelada.' } : { ok: false, texto: r.erro });
        });
      }}
    >
      <label className="block text-xs text-stone-700">
        Motivo (aparece na SEFAZ, mínimo 15 letras)
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          placeholder="Ex.: pedido cancelado a pedido da cliente"
          maxLength={255}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pendente || motivo.trim().length < 15} className="rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
          {pendente ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="rounded-md border px-3 py-2 text-xs">
          Voltar
        </button>
      </div>
      <p className="text-xs text-stone-600">A SEFAZ só aceita cancelar em até 24 horas depois da emissão.</p>
      {msg && <p className={`text-xs ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.texto}</p>}
    </form>
  );
}
