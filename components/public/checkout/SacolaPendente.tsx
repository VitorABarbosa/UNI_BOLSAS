'use client';

import Link from 'next/link';
import { usePedido } from '@/hooks/usePedido';
import { resumoPedido } from '@/lib/pedido';

/**
 * "Você tem peças na sacola": leva de volta pra compra quem saiu dela pra
 * entrar, criar conta ou confirmar o e-mail.
 */
export function SacolaPendente() {
  const { pecas } = resumoPedido(usePedido());
  if (pecas === 0) return null;
  return (
    <div className="uni-sacola-pendente" role="status">
      <span>
        Você tem <strong>{pecas} {pecas === 1 ? 'peça' : 'peças'}</strong> na sacola.
      </span>
      <Link href="/finalizar" className="uni-conta-btn">
        Finalizar compra
      </Link>
    </div>
  );
}
