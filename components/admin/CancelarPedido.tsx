'use client';

import { useState, useTransition } from 'react';
import { cancelarPedidoAdmin } from '@/app/admin/_actions/pedidos';

/** Cancelar o pedido e devolver o dinheiro (com confirmação). */
export function CancelarPedido({ refPedido, valor }: { refPedido: string; valor: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [pendente, start] = useTransition();
  const [r, setR] = useState<{ ok: boolean; texto: string; avisos?: string[] } | null>(null);

  if (r?.ok) {
    return (
      <div className="space-y-1 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        <p>✓ {r.texto}</p>
        {r.avisos?.map((a) => (
          <p key={a} className="text-amber-800">
            ⚠ {a}
          </p>
        ))}
      </div>
    );
  }
  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-700">
        Cancelar pedido e devolver o dinheiro
      </button>
    );
  }
  return (
    <form
      className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm(`Devolver ${valor} para a cliente e cancelar o pedido? Não dá para desfazer.`)) return;
        start(async () => {
          const res = await cancelarPedidoAdmin(refPedido, motivo);
          setR(res.ok ? { ok: true, texto: `Pedido cancelado e ${valor} devolvido. A cliente foi avisada por e-mail.`, avisos: res.avisos } : { ok: false, texto: res.erro });
        });
      }}
    >
      <p className="text-xs text-stone-700">
        Devolve <strong>{valor}</strong> pelo Mercado Pago, cancela a nota fiscal (se emitida há menos de 24 h) e avisa a cliente por e-mail.
      </p>
      <label className="block text-xs text-stone-700">
        Motivo (vai no e-mail para a cliente)
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          placeholder="Ex.: peça esgotada / a pedido da cliente"
          maxLength={200}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pendente || motivo.trim().length < 5} className="rounded-md bg-red-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">
          {pendente ? 'Cancelando…' : 'Confirmar: cancelar e devolver'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="rounded-md border bg-white px-3 py-2 text-xs">
          Voltar
        </button>
      </div>
      {r && !r.ok && <p className="text-xs text-red-700">{r.texto}</p>}
    </form>
  );
}
