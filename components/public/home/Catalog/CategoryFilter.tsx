'use client';

export type CategoryOption = { id: string; label: string };

type CategoryFilterProps = {
  categories: CategoryOption[];
  activeCat: string;
  counts: Record<string, number>;
  onChange: (id: string) => void;
};

export function CategoryFilter({
  categories,
  activeCat,
  counts,
  onChange,
}: CategoryFilterProps) {
  return (
    <div
      className="uni-cat-filter"
      role="tablist"
      aria-label="Filtrar por categoria"
    >
      {categories.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={activeCat === c.id}
          className={'uni-cat-btn ' + (activeCat === c.id ? 'is-active' : '')}
          onClick={() => onChange(c.id)}
        >
          {c.label}
          <span className="uni-cat-count">{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
