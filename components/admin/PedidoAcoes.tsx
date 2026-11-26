'use client';

import { useState, useTransition } from 'react';
import { avisarPronto, confirmarRetirada, imprimirEtiqueta, tentarDeNovo } from '@/app/admin/_actions/pedidos';

/** Botões do pedido no painel: imprimir a etiqueta e tentar de novo. */
export function PedidoAcoes({
  refPedido,
  temEtiqueta,
  temErro,
  retirada,
}: {
  refPedido: string;
  temEtiqueta: boolean;
  temErro: boolean;
  /** Só em pedido de retirada: em que pé está. */
  retirada?: { pronto: boolean; retirado: boolean };
}) {
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {temEtiqueta && (
        <button
          type="button"
          disabled={pendente}
          className="rounded bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await imprimirEtiqueta(refPedido);
              if (r.ok && r.url) window.open(r.url, '_blank', 'noopener');
              else if (!r.ok) setMsg(r.erro);
            })
          }
        >
          Imprimir etiqueta
        </button>
      )}
      {temErro && (
        <button
          type="button"
          disabled={pendente}
          className="rounded border border-stone-900 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await tentarDeNovo(refPedido);
              setMsg(r.ok ? 'Feito.' : r.erro);
            })
          }
        >
          {pendente ? 'Processando…' : 'Tentar de novo'}
        </button>
      )}
      {retirada && !retirada.pronto && (
        <button
          type="button"
          disabled={pendente}
          className="rounded bg-stone-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await avisarPronto(refPedido);
              setMsg(r.ok ? 'Cliente avisada por e-mail.' : r.erro);
            })
          }
        >
          Pronto para retirar (avisar cliente)
        </button>
      )}
      {retirada && retirada.pronto && !retirada.retirado && (
        <button
          type="button"
          disabled={pendente}
          className="rounded border border-stone-900 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await confirmarRetirada(refPedido);
              setMsg(r.ok ? 'Marcado como retirado.' : r.erro);
            })
          }
        >
          Cliente retirou
        </button>
      )}
      {msg && <span className="text-xs text-stone-600">{msg}</span>}
    </div>
  );
}
