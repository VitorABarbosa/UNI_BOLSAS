'use client';

import { useState } from 'react';

export type Ficha = {
  description: string | null;
  tagline?: string | null;
  dimensions: string | null;
  weight: string | null;
  material: string | null;
};

/** Quantos caracteres a janela de detalhes mostra antes do "Ler mais". */
const RESUMO_CHARS = 320;

const preenchido = (v: string | null | undefined): v is string =>
  typeof v === 'string' && v.trim() !== '';

/**
 * Descrição e ficha técnica da peça — a mesma na página e na janela de
 * detalhes.
 *
 * Campo vazio não aparece. Antes a ficha mostrava "—" em medidas, peso e
 * material de toda peça importada (a importação só traz a descrição): três
 * traços que liam como "a loja não sabe" em vez de simplesmente não estarem
 * ali.
 *
 * A descrição mantém as quebras de linha: as que vêm da Shopee são listas
 * ("✔ Bolso frontal", "✔ Alça acolchoada") e viravam um bloco corrido.
 */
export function FichaPeca({
  ficha,
  resumida = false,
}: {
  ficha: Ficha;
  /** Na janela de detalhes a descrição longa começa recolhida. */
  resumida?: boolean;
}) {
  const [aberta, setAberta] = useState(false);
  const texto = preenchido(ficha.description)
    ? ficha.description.trim()
    : preenchido(ficha.tagline)
      ? ficha.tagline.trim()
      : '';
  const longa = resumida && texto.length > RESUMO_CHARS;
  const visivel =
    longa && !aberta
      ? texto.slice(0, RESUMO_CHARS).replace(/\s+\S*$/, '') + '…'
      : texto;
  const paragrafos = visivel
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const specs = [
    { rotulo: 'Medidas', valor: ficha.dimensions, largo: false },
    { rotulo: 'Peso', valor: ficha.weight, largo: false },
    { rotulo: 'Material', valor: ficha.material, largo: true },
  ].filter((s) => preenchido(s.valor));

  return (
    <>
      {paragrafos.length > 0 && (
        <div className="uni-ficha-desc">
          {paragrafos.map((p, i) => (
            <p key={i} className="uni-qv-desc">
              {p}
            </p>
          ))}
          {longa && (
            <button
              type="button"
              className="uni-ficha-mais"
              onClick={() => setAberta((v) => !v)}
              aria-expanded={aberta}
            >
              {aberta ? 'Mostrar menos' : 'Ler descrição completa'}
            </button>
          )}
        </div>
      )}
      {specs.length > 0 && (
        <div className="uni-qv-spec-grid">
          {specs.map((s) => (
            <div key={s.rotulo} style={s.largo ? { gridColumn: '1 / -1' } : undefined}>
              <div className="uni-qv-spec-label">{s.rotulo}</div>
              <div className={'uni-qv-spec-val' + (s.largo ? ' is-text' : '')}>
                {s.valor}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
