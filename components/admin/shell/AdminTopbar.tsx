import type { ReactNode } from 'react';

export function AdminTopbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-whisper bg-pearl px-4 py-2 md:px-6">
      <h1 className="font-serif text-lg text-ink">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
