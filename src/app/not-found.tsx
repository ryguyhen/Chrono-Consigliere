// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center text-center px-6">
      <div className="text-[6rem] font-light text-ink/8 leading-none mb-6 tracking-[-0.04em]">404</div>
      <h1 className="text-[1.6rem] font-normal tracking-[-0.02em] mb-3">Not found</h1>
      <p className="text-[14px] text-muted mb-8 max-w-[340px]">
        This may have sold, or the link is broken.
      </p>
      <div className="flex gap-3">
        <Link
          href="/browse"
          className="bg-gold text-ink text-[11px] font-medium tracking-[0.1em] uppercase px-5 py-2.5 rounded hover:bg-gold-dark transition-colors"
        >
          Browse watches
        </Link>
        <Link
          href="/"
          className="border border-[var(--border)] text-ink text-[11px] font-medium tracking-[0.1em] uppercase px-5 py-2.5 rounded hover:border-gold hover:text-gold transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
