'use client';

import type { PaletteColor } from '@/lib/content/color-palette';

type ColorFilterProps = {
  palette: ReadonlyArray<PaletteColor>;
  activeColor: string | null;
  onChange: (hex: string | null) => void;
};

export function ColorFilter({ palette, activeColor, onChange }: ColorFilterProps) {
  return (
    <div className="uni-color-filter" role="toolbar" aria-label="Filtrar por cor">
      <span className="uni-color-filter-label">Cor:</span>
      <button
        className={
          'uni-color-swatch-big is-clear ' + (!activeColor ? 'is-selected' : '')
        }
        onClick={() => onChange(null)}
        aria-label="Todas as cores"
      >
        Todas
      </button>
      {palette.map((c) => (
        <button
          key={c.name}
          className={
            'uni-color-swatch-big ' +
            (activeColor === c.hex ? 'is-selected' : '')
          }
          style={{ background: c.hex }}
          onClick={() => onChange(activeColor === c.hex ? null : c.hex)}
          aria-label={`Cor ${c.name}`}
          title={c.name}
        />
      ))}
    </div>
  );
}
