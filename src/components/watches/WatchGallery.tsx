'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { shopifyThumbnailUrl } from '@/lib/format';

interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText: string | null;
}

interface WatchGalleryProps {
  images: GalleryImage[];
  title: string;
  sourceName: string;
}

export function WatchGallery({ images, title, sourceName }: WatchGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const active = images[activeIndex];

  const prev = useCallback(() => setActiveIndex(i => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActiveIndex(i => (i + 1) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightboxOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, prev, next]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) >= 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  return (
    <div className="bg-[#161616] flex flex-col items-center justify-center p-4 sm:p-8 min-h-[300px] sm:min-h-[400px]">
      {/* Main image */}
      <div
        className="relative w-full max-w-[500px] aspect-square rounded-lg overflow-hidden group"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {active ? (
          <>
            <Image
              src={shopifyThumbnailUrl(active.url, 800)}
              alt={active.altText ?? title}
              fill
              sizes="500px"
              className="object-contain cursor-zoom-in"
              priority={activeIndex === 0}
              onClick={() => setLightboxOpen(true)}
            />
            {count > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-black/50 hover:bg-black/75 text-white text-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-black/50 hover:bg-black/75 text-white text-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-ink/10 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-ink/[0.07] flex items-center justify-center">
                <div className="font-mono text-[9px] tracking-widest uppercase text-ink/20">Dial</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative w-14 h-14 rounded overflow-hidden flex-shrink-0 transition-all ${
                i === activeIndex
                  ? 'ring-2 ring-gold ring-offset-1 ring-offset-[#161616]'
                  : 'ring-1 ring-white/10 opacity-50 hover:opacity-100'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={shopifyThumbnailUrl(img.url, 200)} alt={`Image ${i + 1}`} fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted/60 mt-4 text-center italic max-w-[320px]">
        All photos from {sourceName}. View the original listing for complete photography.
      </p>

      {/* Lightbox */}
      {lightboxOpen && active && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white/60 hover:text-white text-lg z-10"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
          <div
            className="relative w-[90vmin] h-[90vmin]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={active.altText ?? title}
              fill
              sizes="90vmin"
              className="object-contain"
            />
            {count > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white text-2xl rounded-full z-10"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/75 text-white text-2xl rounded-full z-10"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-4 text-white/40 text-[11px] font-mono">
            {activeIndex + 1} / {count}
          </div>
        </div>
      )}
    </div>
  );
}
