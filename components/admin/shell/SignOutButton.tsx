'use client';

import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/admin/_actions/auth';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-stone transition-colors hover:bg-whisper/40 hover:text-ink"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair
      </button>
    </form>
  );
}
