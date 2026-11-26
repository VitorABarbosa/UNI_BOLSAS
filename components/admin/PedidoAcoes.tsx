'use client';

import { useState, useTransition } from 'react';
import {
  avisarPronto,
  confirmarEntrega,
  confirmarRetirada,
  imprimirEtiqueta,
  informarEnvio,
  tentarDeNovo,
  type RespostaAdmin,
} from '@/app/admin/_actions/pedidos';

export type SituacaoAcoes = {
  entrega: 'envio' | 'retirada';
  temEtiqueta: boolean;
  temErro: boolean;
  postado: boolean;
  entregue: boolean;
  pronto: boolean;
  retirado: boolean;
};

const principal = 'rounded-md bg-stone-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50';
const secundario = 'rounded-md border border-stone-900 bg-white px-3 py-2 text-xs font-medium disabled:opacity-50';

/** O que dá pra fazer com o pedido, conforme a etapa em que ele está. */
export function PedidoAcoes({ refPedido, s }: { refPedido: string; s: SituacaoAcoes }) {
  const [pendente, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [codigo, setCodigo] = useState('');

  const rodar = (fn: () => Promise<RespostaAdmin>, sucesso: string) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, texto: sucesso } : { ok: false, texto: r.erro });
    });

  const concluido = s.entrega === 'retirada' ? s.retirado : s.entregue;
  return (
    <div className="space-y-3">
      {concluido && !s.temErro && <p className="text-sm text-stone-600">Pedido concluído. Nada a fazer.</p>}
      <div className="flex flex-wrap items-center gap-2 empty:hidden">
        {s.temEtiqueta && !s.entregue && (
          <button
            type="button"
            disabled={pendente}
            className={principal}
            onClick={() =>
              start(async () => {
                setMsg(null);
                const r = await imprimirEtiqueta(refPedido);
                if (r.ok && r.url) window.open(r.url, '_blank', 'noopener');
                else if (!r.ok) setMsg({ ok: false, texto: r.erro });
              })
            }
          >
            Imprimir etiqueta
          </button>
        )}
        {s.temErro && (
          <button type="button" disabled={pendente} className={secundario} onClick={() => rodar(() => tentarDeNovo(refPedido), 'Feito.')}>
            {pendente ? 'Processando…' : 'Tentar de novo'}
          </button>
        )}
        {s.entrega === 'retirada' && !s.pronto && (
          <button type="button" disabled={pendente} className={principal} onClick={() => rodar(() => avisarPronto(refPedido), 'Cliente avisada por e-mail.')}>
            Pronto para retirar (avisar cliente)
          </button>
        )}
        {s.entrega === 'retirada' && s.pronto && !s.retirado && (
          <button type="button" disabled={pendente} className={secundario} onClick={() => rodar(() => confirmarRetirada(refPedido), 'Marcado como retirado.')}>
            Cliente retirou
          </button>
        )}
        {s.entrega === 'envio' && s.postado && !s.entregue && (
          <button type="button" disabled={pendente} className={secundario} onClick={() => rodar(() => confirmarEntrega(refPedido), 'Marcado como entregue. Cliente avisada.')}>
            Marcar como entregue
          </button>
        )}
      </div>

      {s.entrega === 'envio' && !s.postado && (
        <form
          className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-stone-300 bg-stone-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            rodar(() => informarEnvio(refPedido, codigo), 'Marcado como enviado. Cliente recebeu o rastreio por e-mail.');
          }}
        >
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-stone-600">
            {s.temEtiqueta ? 'Postou por outro caminho? Código de rastreio' : 'Enviou por fora (Correios, Melhor Envio…)? Código de rastreio'}
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex.: AB123456789BR"
              className="rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm uppercase"
              autoComplete="off"
            />
          </label>
          <button type="submit" disabled={pendente || !codigo.trim()} className={principal}>
            Marcar como enviado
          </button>
        </form>
      )}

      {msg && <p className={`text-xs ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.texto}</p>}
    </div>
  );
}

/** Imprime a página (a lista de separação usa o CSS de impressão). */
export function BotaoImprimir({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className={secundario} onClick={() => window.print()}>
      {children}
    </button>
  );
}
