'use client';
import { useState } from 'react';

interface Props {
  watchId: string;
  initialSaved: boolean;
}

export function WatchSaveButton({ watchId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const method = saved ? 'DELETE' : 'POST';
    const res = await fetch(`/api/saves/${watchId}`, { method });
    if (res.ok) setSaved(!saved);
    setLoading(false);
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`px-5 py-3 rounded text-[11px] font-bold tracking-[0.1em] uppercase transition-colors disabled:opacity-50
        ${saved
          ? 'bg-gold text-black hover:bg-gold-dark'
          : 'border border-[var(--border)] text-muted hover:border-gold hover:text-gold'}`}
    >
      {loading ? '…' : saved ? 'In your roll' : '+ Add to roll'}
    </button>
  );
}
