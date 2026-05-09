'use client';

import type { Database } from '@/types/db';

type ColorRow = Database['public']['Tables']['product_colors']['Row'];

type ColorSwatchesProps = {
  colors: ColorRow[];
  activeIdx: number;
  onChange: (idx: number) => void;
};

export function ColorSwatches({ colors, activeIdx, onChange }: ColorSwatchesProps) {
  return (
    <div className="uni-qv-swatch-row">
      {colors.map((c, i) => (
        <button
          key={c.id}
          className={'uni-swatch ' + (activeIdx === i ? 'is-selected' : '')}
          style={{
            width: 30,
            height: 30,
            background: c.accent_hex
              ? `linear-gradient(135deg, ${c.hex} 0% 60%, ${c.accent_hex} 60% 100%)`
              : c.hex,
          }}
          onClick={() => onChange(i)}
          aria-label={`Cor ${c.name}`}
          title={c.name}
        />
      ))}
    </div>
  );
}
