'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LEN = 40;

export function SizesInput({
  value,
  onChange,
  name,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  name?: string;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addCurrent = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) return;
    if (value.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...value, trimmed]);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCurrent();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 1) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/30"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((sz, i) => (
        <span
          key={`${sz}-${i}`}
          className="inline-flex items-center gap-1 rounded-sm bg-whisper px-2 py-0.5 text-xs text-ink"
        >
          {sz}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            disabled={value.length <= 1}
            className={cn(
              '-mr-1 inline-flex h-4 w-4 items-center justify-center rounded-sm transition-colors',
              value.length <= 1 ? 'cursor-not-allowed opacity-40' : 'hover:bg-stone/20',
            )}
            aria-label={`Remover tamanho ${sz}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        name={name}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={addCurrent}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? 'Digite e Enter' : 'Adicionar…'}
        maxLength={MAX_LEN}
        className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-stone/60"
      />
    </div>
  );
}
