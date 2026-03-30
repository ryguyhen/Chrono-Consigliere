// src/components/watches/WatchCard.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { WatchWithRelations } from '@/types';

interface WatchCardProps {
  watch: WatchWithRelations;
  onLike?: (id: string, liked: boolean) => void;
  onSave?: (id: string, saved: boolean) => void;
}

function formatPrice(cents: number | null, currency = 'USD'): string {
  if (!cents) return 'Price on request';
  const amount = cents / 100;
  if (currency === 'JPY') return `¥${amount.toLocaleString('ja-JP')}`;
  if (currency === 'EUR') return `€${amount.toLocaleString('de-DE')}`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const CONDITION_BADGES: Record<string, string> = {
  UNWORN: 'Unworn',
  MINT: 'Mint',
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
};

export function WatchCard({ watch, onLike, onSave }: WatchCardProps) {
  const [liked, setLiked] = useState(watch.isLiked ?? false);
  const [saved, setSaved] = useState(watch.isSaved ?? false);
  const [likeCount, setLikeCount] = useState(watch.likeCount);

  const primaryImage = watch.images?.[0];

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    const next = !liked;
    setLiked(next);
    setLikeCount(prev => prev + (next ? 1 : -1));
    onLike?.(watch.id, next);
    // Optimistic — fire API in background
    fetch(`/api/likes/${watch.id}`, { method: next ? 'POST' : 'DELETE' }).catch(() => {
      // Revert on failure
      setLiked(!next);
      setLikeCount(prev => prev + (next ? -1 : 1));
    });
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    const next = !saved;
    setSaved(next);
    onSave?.(watch.id, next);
    fetch(`/api/saves/${watch.id}`, { method: next ? 'POST' : 'DELETE' }).catch(() => setSaved(!next));
  }

  return (
    <Link
      href={`/watch/${watch.id}`}
      className="group block bg-surface border border-[var(--border)] rounded-lg overflow-hidden transition-all duration-150 hover:border-gold/40 hover:-translate-y-px hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-square bg-parchment overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText ?? watch.sourceTitle}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-ink/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-ink/[0.07] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-ink/10" />
              </div>
            </div>
          </div>
        )}

        {/* Condition badge */}
        {watch.condition && watch.condition !== 'GOOD' && (
          <div className={`absolute top-2.5 left-2.5 text-[9px] font-medium tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm
            ${watch.condition === 'UNWORN' || watch.condition === 'MINT'
              ? 'bg-ink text-cream'
              : 'bg-gold/90 text-ink'}`}>
            {CONDITION_BADGES[watch.condition]}
          </div>
        )}

        {/* Heart button */}
        <button
          onClick={handleLike}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all
            ${liked
              ? 'bg-red-50 border border-red-200 text-red-500'
              : 'bg-surface/90 border border-[var(--border)] text-ink/40 hover:border-red-200 hover:text-red-400'}`}
          title={liked ? 'Unlike' : 'Like'}
        >
          {liked ? '♥' : '♡'}
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`absolute top-11 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all
            ${saved
              ? 'bg-gold/10 border border-gold/40 text-gold'
              : 'bg-surface/90 border border-[var(--border)] text-ink/40 hover:border-gold/30 hover:text-gold/60'}`}
          title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          {saved ? '⊕' : '⊕'}
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-gold mb-0.5">
          {watch.brand}
        </div>
        <div className="font-serif text-base font-normal text-ink leading-tight mb-1.5">
          {watch.model || watch.sourceTitle}
        </div>

        {/* Specs pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {watch.caseSizeMm && (
            <span className="text-[10px] bg-parchment rounded px-1.5 py-0.5 text-ink/70">
              {watch.caseSizeMm}mm
            </span>
          )}
          {watch.movementType && (
            <span className="text-[10px] bg-parchment rounded px-1.5 py-0.5 text-ink/70">
              {watch.movementType === 'AUTOMATIC' ? 'Auto' : watch.movementType === 'MANUAL' ? 'Manual' : watch.movementType}
            </span>
          )}
          {watch.year && (
            <span className="text-[10px] bg-parchment rounded px-1.5 py-0.5 text-ink/70">
              {watch.year}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="font-serif text-[18px] font-light text-ink mb-2">
          {watch.sourcePrice ?? formatPrice(watch.price, watch.currency)}
        </div>

        {/* Dealer + likes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
            {watch.source.name}
          </div>
          <span className="text-[10px] text-muted font-mono">♥ {likeCount}</span>
        </div>
      </div>
    </Link>
  );
}
