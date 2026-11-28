'use client';

import { useEffect, useState } from 'react';
import { STORE } from '@/lib/content/store';

const DIAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const hora = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + (m ?? 0);
};
const rotulo = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

/** Agora em São Paulo: dia da semana (0 = domingo) e minutos do dia. */
function agoraSP() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday!);
  return { dia, min: Number(p.hour) * 60 + Number(p.minute) };
}

function horarioDo(dia: number) {
  return STORE.openingHours.find((h) => (h.days as readonly string[]).includes(DIAS[dia]!)) ?? null;
}

/** "Aberto agora · até 11h" ou "Fechado · abre amanhã às 4h", pelo horário de Brasília. */
export function situacaoDaLoja(): { aberta: boolean; texto: string } {
  const { dia, min } = agoraSP();
  const hoje = horarioDo(dia);
  if (hoje && min >= hora(hoje.opens) && min < hora(hoje.closes)) {
    return { aberta: true, texto: `Aberto agora · até ${rotulo(hoje.closes)}` };
  }
  if (hoje && min < hora(hoje.opens)) return { aberta: false, texto: `Fechado · abre hoje às ${rotulo(hoje.opens)}` };
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const h = horarioDo(d);
    if (h) return { aberta: false, texto: `Fechado · abre ${i === 1 ? 'amanhã' : NOME[d]} às ${rotulo(h.opens)}` };
  }
  return { aberta: false, texto: 'Fechado' };
}

/** Selo de loja aberta/fechada. Calculado no navegador (a página é cacheada). */
export function LojaAberta({ className = '' }: { className?: string }) {
  const [s, setS] = useState<ReturnType<typeof situacaoDaLoja> | null>(null);
  useEffect(() => {
    const atualizar = () => setS(situacaoDaLoja());
    atualizar();
    const t = window.setInterval(atualizar, 60_000);
    return () => window.clearInterval(t);
  }, []);
  if (!s) return <span className={`uni-loja-status is-carregando ${className}`} aria-hidden="true" />;
  return (
    <span className={`uni-loja-status ${s.aberta ? 'is-aberta' : 'is-fechada'} ${className}`}>
      <i aria-hidden="true" />
      {s.texto}
    </span>
  );
}
