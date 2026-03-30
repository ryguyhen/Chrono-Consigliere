// src/app/browse/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { getWatches, getFilterOptions } from '@/lib/watches/queries';
import { Suspense } from 'react';
import { WatchCard } from '@/components/watches/WatchCard';
import { BrowseFilters } from '@/components/watches/BrowseFilters';
import { SortSelect } from '@/components/watches/SortSelect';
import Link from 'next/link';
import type { BrowseFilters as FiltersType } from '@/types';

interface PageProps {
  searchParams: {
    q?: string;
    brand?: string | string[];
    style?: string | string[];
    movement?: string | string[];
    condition?: string | string[];
    dealer?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const filters: FiltersType = {
    q: searchParams.q,
    brand: toArray(searchParams.brand),
    style: toArray(searchParams.style),
    movement: toArray(searchParams.movement),
    condition: toArray(searchParams.condition),
    dealer: toArray(searchParams.dealer),
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    sort: searchParams.sort as FiltersType['sort'] ?? 'newest',
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  };

  const [{ watches, total, hasMore, page }, filterOptions] = await Promise.all([
    getWatches(filters, userId),
    getFilterOptions(),
  ]);

  const hasFilters = (filters.brand?.length ?? 0) + (filters.style?.length ?? 0) +
    (filters.movement?.length ?? 0) + (filters.condition?.length ?? 0) +
    (filters.dealer?.length ?? 0) > 0 || filters.q || filters.minPrice || filters.maxPrice;

  return (
    <div className="flex min-h-[calc(100vh-52px)]">
      <Suspense fallback={<div className="w-[220px] flex-shrink-0 bg-surface border-r border-[var(--border)]" />}>
        <BrowseFilters {...filterOptions} />
      </Suspense>

      <div className="flex-1 flex flex-col">
        {/* Search + Sort bar */}
        <div className="bg-surface border-b border-[var(--border)] px-5 py-3 flex gap-3 items-center">
          <form className="flex-1" action="/browse" method="GET">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search by brand, reference, or description…"
              className="w-full px-3 py-2 text-[13px] border border-[var(--border)] rounded bg-cream text-ink outline-none focus:border-gold"
            />
          </form>
          <SortSelect defaultValue={filters.sort ?? 'newest'} />
          <span className="text-[12px] text-muted font-mono whitespace-nowrap">
            {total.toLocaleString()} watches
          </span>
          {hasFilters && (
            <Link href="/browse" className="text-[11px] text-gold hover:text-gold-dark">
              Clear filters
            </Link>
          )}
        </div>

        {/* Grid */}
        {watches.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
            {watches.map(watch => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-muted">
            <div className="font-serif text-4xl mb-4 opacity-20">⌚</div>
            <div className="font-serif text-xl font-light mb-2">No watches found</div>
            <p className="text-sm">Try adjusting your filters or clearing your search.</p>
            <Link href="/browse" className="mt-4 text-[12px] text-gold hover:text-gold-dark">
              Clear all filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        {(hasMore || page > 1) && (
          <div className="flex justify-center gap-2 py-8 border-t border-[var(--border)]">
            {page > 1 && (
              <Link
                href={`/browse?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])), page: String(page - 1) })}`}
                className="px-4 py-2 text-[12px] border border-[var(--border)] rounded hover:border-gold text-ink"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-[12px] text-muted">Page {page}</span>
            {hasMore && (
              <Link
                href={`/browse?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])), page: String(page + 1) })}`}
                className="px-4 py-2 text-[12px] border border-[var(--border)] rounded hover:border-gold text-ink"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
