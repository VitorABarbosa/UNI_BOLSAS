'use client';

import { useEffect } from 'react';
import { limparPedido } from '@/lib/pedido';

/** Esvazia a sacola quando o pedido já foi pago (ou está aguardando Pix/boleto). */
export function LimparSacola() {
  useEffect(() => {
    limparPedido();
  }, []);
  return null;
}
