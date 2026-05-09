'use client';

type SizePickerProps = {
  sizes: string[];
  activeIdx: number;
  onChange: (idx: number) => void;
};

export function SizePicker({ sizes, activeIdx, onChange }: SizePickerProps) {
  if (sizes.length <= 1) return null;
  return (
    <div className="uni-qv-size-row">
      {sizes.map((s, i) => (
        <button
          key={s}
          className={
            'uni-qv-size-chip ' + (activeIdx === i ? 'is-selected' : '')
          }
          onClick={() => onChange(i)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
