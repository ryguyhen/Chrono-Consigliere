'use client';
// Renders in the Roll grid when a saved/owned listing has gone unavailable.
// Shows the watch identity dimmed, blocks the dead detail-page link, and
// provides a one-tap remove action so users can clean up their Roll.
import { useState } from 'react';

interface Props {
  listingId: string;
  brand: string;
  title: string;
}

export function UnavailableWatchCard({ listingId, brand, title }: Props) {
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch(`/api/saves/${listingId}`, { method: 'DELETE' });
    if (res.ok) setRemoved(true);
    else setRemoving(false);
  }

  if (removed) return null;

  return (
    <div className="opacity-60">
      {/* Image placeholder — same aspect ratio as WatchCard */}
      <div className="relative aspect-[4/5] bg-[var(--border)] rounded overflow-hidden flex items-center justify-center">
        <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-muted/60 text-center px-3 leading-relaxed">
          No longer<br />available
        </span>
      </div>
      <div className="pt-3 pb-1">
        <div className="font-mono text-[9px] font-medium tracking-[0.14em] uppercase text-muted mb-0.5">
          {brand}
        </div>
        <div className="text-[13px] font-medium text-muted leading-snug mb-2 line-through decoration-muted/40">
          {title}
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted/60 hover:text-gold transition-colors disabled:opacity-40"
        >
          {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  );
}
