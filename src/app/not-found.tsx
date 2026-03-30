// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center text-center px-6">
      <div className="font-serif text-[6rem] font-light text-ink/10 leading-none mb-6">404</div>
      <h1 className="font-serif text-[1.8rem] font-light mb-3">Page not found</h1>
      <p className="text-[14px] text-muted mb-8 max-w-[380px]">
        This watch may have sold, or the page you're looking for doesn't exist.
      </p>
      <div className="flex gap-3">
        <Link
          href="/browse"
          className="bg-gold text-ink text-[12px] font-medium tracking-[0.06em] uppercase px-5 py-2.5 rounded hover:bg-gold-dark transition-colors"
        >
          Browse inventory
        </Link>
        <Link
          href="/"
          className="border border-[var(--border)] text-ink text-[12px] font-medium tracking-[0.06em] uppercase px-5 py-2.5 rounded hover:border-gold hover:text-gold transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
