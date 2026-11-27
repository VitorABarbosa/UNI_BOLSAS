'use client';

import { useEffect, useRef, useState } from 'react';
import { FAMILIAS_COR } from '@/lib/content/cores';

export type FaixaPreco = { id: string; rotulo: string; min: number; max: number };
export type Ordem = 'relevancia' | 'menor' | 'maior' | 'novos';

/** Faixas de preço por peça, no atacado. */
export const FAIXAS_PRECO: FaixaPreco[] = [
  { id: 'ate30', rotulo: 'Até R$ 30', min: 0, max: 30 },
  { id: '30a60', rotulo: 'R$ 30 a R$ 60', min: 30, max: 60 },
  { id: '60a100', rotulo: 'R$ 60 a R$ 100', min: 60, max: 100 },
  { id: 'acima100', rotulo: 'Acima de R$ 100', min: 100, max: Infinity },
];

export const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: 'relevancia', rotulo: 'Destaques' },
  { id: 'menor', rotulo: 'Menor preço' },
  { id: 'maior', rotulo: 'Maior preço' },
  { id: 'novos', rotulo: 'Novidades primeiro' },
];

type Props = {
  cor: string | null;
  faixa: string | null;
  ordem: Ordem;
  contagemCor: Record<string, number>;
  contagemFaixa: Record<string, number>;
  onCor: (id: string | null) => void;
  onFaixa: (id: string | null) => void;
  onOrdem: (o: Ordem) => void;
  onLimpar: () => void;
};

type Aberto = 'cor' | 'preco' | 'ordem' | null;

function Seta() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Cor, preço e ordem do catálogo: três botões que abrem uma lista curta.
 * Só aparecem as cores e faixas que têm peça (com a contagem ao lado).
 */
export function CatalogFiltros(p: Props) {
  const [aberto, setAberto] = useState<Aberto>(null);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(null);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(null);
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const familia = FAMILIAS_COR.find((f) => f.id === p.cor) ?? null;
  const faixa = FAIXAS_PRECO.find((f) => f.id === p.faixa) ?? null;
  const ordem = ORDENS.find((o) => o.id === p.ordem)!;
  const cores = FAMILIAS_COR.filter((f) => (p.contagemCor[f.id] ?? 0) > 0);
  const algum = !!(p.cor || p.faixa || p.ordem !== 'relevancia');
  const alternar = (a: Aberto) => setAberto((x) => (x === a ? null : a));
  const escolher = (fn: () => void) => {
    fn();
    setAberto(null);
  };

  return (
    <div className="uni-filtros" ref={raiz}>
      <div className="uni-filtros-linha">
        <button
          type="button"
          className={'uni-filtro-btn' + (familia ? ' is-on' : '')}
          aria-expanded={aberto === 'cor'}
          onClick={() => alternar('cor')}
        >
          {familia ? <span className="uni-filtro-bolinha" style={{ background: familia.hex }} /> : null}
          {familia ? familia.nome : 'Cor'}
          <Seta />
        </button>
        <button
          type="button"
          className={'uni-filtro-btn' + (faixa ? ' is-on' : '')}
          aria-expanded={aberto === 'preco'}
          onClick={() => alternar('preco')}
        >
          {faixa ? faixa.rotulo : 'Preço'}
          <Seta />
        </button>
        <button
          type="button"
          className={'uni-filtro-btn' + (p.ordem !== 'relevancia' ? ' is-on' : '')}
          aria-expanded={aberto === 'ordem'}
          onClick={() => alternar('ordem')}
        >
          <span className="uni-filtro-pre">Ordenar:</span> {ordem.rotulo}
          <Seta />
        </button>
        {algum && (
          <button type="button" className="uni-filtro-limpar" onClick={() => escolher(p.onLimpar)}>
            Limpar filtros
          </button>
        )}
      </div>

      {aberto === 'cor' && (
        <div className="uni-filtro-painel is-cores" role="listbox" aria-label="Filtrar por cor">
          {cores.map((f) => (
            <button
              key={f.id}
              type="button"
              role="option"
              aria-selected={p.cor === f.id}
              className={'uni-filtro-cor' + (p.cor === f.id ? ' is-on' : '')}
              onClick={() => escolher(() => p.onCor(p.cor === f.id ? null : f.id))}
            >
              <span className="uni-filtro-bolinha" style={{ background: f.hex }} />
              <span>{f.nome}</span>
              <small>{p.contagemCor[f.id]}</small>
            </button>
          ))}
          {p.cor && (
            <button type="button" className="uni-filtro-cor is-todas" onClick={() => escolher(() => p.onCor(null))}>
              Todas as cores
            </button>
          )}
        </div>
      )}

      {aberto === 'preco' && (
        <div className="uni-filtro-painel" role="listbox" aria-label="Filtrar por preço">
          {FAIXAS_PRECO.filter((f) => (p.contagemFaixa[f.id] ?? 0) > 0).map((f) => (
            <button
              key={f.id}
              type="button"
              role="option"
              aria-selected={p.faixa === f.id}
              className={'uni-filtro-opcao' + (p.faixa === f.id ? ' is-on' : '')}
              onClick={() => escolher(() => p.onFaixa(p.faixa === f.id ? null : f.id))}
            >
              <span>{f.rotulo}</span>
              <small>{p.contagemFaixa[f.id]}</small>
            </button>
          ))}
          {p.faixa && (
            <button type="button" className="uni-filtro-opcao is-todas" onClick={() => escolher(() => p.onFaixa(null))}>
              Qualquer preço
            </button>
          )}
        </div>
      )}

      {aberto === 'ordem' && (
        <div className="uni-filtro-painel" role="listbox" aria-label="Ordenar">
          {ORDENS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={p.ordem === o.id}
              className={'uni-filtro-opcao' + (p.ordem === o.id ? ' is-on' : '')}
              onClick={() => escolher(() => p.onOrdem(o.id))}
            >
              <span>{o.rotulo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
