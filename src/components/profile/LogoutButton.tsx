'use client';
// src/components/profile/LogoutButton.tsx
// Visible, tappable log-out button used on the profile page so mobile users
// have an explicit account-action path. The desktop nav also exposes a sign-out
// link but it's hidden below the sm breakpoint, leaving phones without one.
// This is the canonical mobile path: bottom nav → Profile → Log out.

import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface Props {
  variant?: 'inline' | 'block';
}

export function LogoutButton({ variant = 'block' }: Props) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    await signOut({ callbackUrl: '/' });
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center justify-center min-h-[44px] px-4 font-mono text-[10px] tracking-[0.12em] uppercase text-white/60 hover:text-gold transition-colors disabled:opacity-50"
      >
        {pending ? 'Signing out…' : 'Log out'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full min-h-[48px] px-5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase border border-[var(--border)] rounded text-ink hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
    >
      {pending ? 'Signing out…' : 'Log out'}
    </button>
  );
}
