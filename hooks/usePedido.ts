'use client';

import { useSyncExternalStore } from 'react';
import {
  readPedido,
  readPedidoServidor,
  subscribePedido,
  type PedidoItem,
} from '@/lib/pedido';

/**
 * O pedido como estado externo — o mesmo padrão do `useConsent`. No servidor
 * a lista é sempre vazia; depois da hidratação o React lê a do aparelho, sem
 * descompasso entre o HTML e a tela.
 */
export function usePedido(): PedidoItem[] {
  return useSyncExternalStore(subscribePedido, readPedido, readPedidoServidor);
}
