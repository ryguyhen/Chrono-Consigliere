'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';

const SPEED_PX_PER_SEC = 40;

export function DealerRail({ dealers }: { dealers: { name: string; slug: string }[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    let lastTs: number | null = null;

    function step(ts: number) {
      if (!el) return;
      if (!pausedRef.current) {
        if (lastTs !== null) {
          el.scrollLeft += (SPEED_PX_PER_SEC * (ts - lastTs)) / 1000;
          // Seamless loop: first copy fills scrollWidth/2, so when we reach that
          // point we teleport back by exactly half — visually imperceptible.
          if (el.scrollLeft >= el.scrollWidth / 2) {
            el.scrollLeft -= el.scrollWidth / 2;
          }
        }
        lastTs = ts;
      } else {
        lastTs = null;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <div className="relative">
      <div
        ref={railRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className="flex gap-2 overflow-x-auto px-4 sm:px-8 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {/* Dealers rendered twice — second copy is aria-hidden + untabbable for
            seamless looping without polluting the accessibility tree */}
        {[0, 1].map((copy) =>
          dealers.map((dealer) => (
            <Link
              key={`${copy}-${dealer.slug}`}
              href={`/browse?dealer=${dealer.slug}`}
              aria-hidden={copy === 1 ? true : undefined}
              tabIndex={copy === 1 ? -1 : undefined}
              className="flex-shrink-0 inline-flex items-center px-3.5 py-1.5 border border-[var(--border)] rounded text-[12px] sm:text-[13px] text-ink/60 hover:border-gold/40 hover:text-gold transition-colors"
            >
              {dealer.name}
            </Link>
          ))
        )}
      </div>
      {/* Edge fades — signal content extends beyond the viewport */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-12 bg-gradient-to-r from-[var(--bg,#111)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-[var(--bg,#111)] to-transparent" />
    </div>
  );
}
