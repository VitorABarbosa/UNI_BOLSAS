import type { ReactNode } from 'react';

export function AdminTopbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-[52px] items-center justify-between border-b border-whisper bg-pearl px-6">
      <h1 className="font-serif text-lg text-ink">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
