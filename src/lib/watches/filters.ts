// src/lib/watches/filters.ts
//
// Helpers for assembling BrowseFilters from URL search params and for
// building pagination/filter URLs. Extracted from browse/page.tsx so
// any future app API endpoint can reuse the same parsing logic.

import type { BrowseFilters } from '@/types';

/** Coerce a string | string[] | undefined URL param to a clean array. */
export function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

const VALID_SORTS: BrowseFilters['sort'][] = ['newest', 'price-asc', 'price-desc', 'most-liked'];

function parsePositiveInt(val: string | string[] | undefined): number | undefined {
  if (!val || Array.isArray(val)) return undefined;
  const n = parseInt(val, 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

/** Parse Next.js searchParams into a typed BrowseFilters object. */
export function parseBrowseFilters(
  searchParams: Record<string, string | string[] | undefined>
): BrowseFilters {
  const rawPage = parsePositiveInt(searchParams.page);
  const rawSort = searchParams.sort as string | undefined;

  return {
    q:         (searchParams.q as string | undefined) || undefined,
    brand:     toArray(searchParams.brand),
    style:     toArray(searchParams.style),
    movement:  toArray(searchParams.movement),
    condition: toArray(searchParams.condition),
    dealer:    toArray(searchParams.dealer),
    minPrice:  parsePositiveInt(searchParams.minPrice),
    maxPrice:  parsePositiveInt(searchParams.maxPrice),
    sort:      VALID_SORTS.includes(rawSort as BrowseFilters['sort']) ? (rawSort as BrowseFilters['sort']) : 'newest',
    page:      rawPage ?? 1,
  };
}

/** True if any filter beyond sort/pagination is active. */
export function hasActiveFilters(filters: BrowseFilters): boolean {
  return (
    (filters.brand?.length ?? 0) > 0 ||
    (filters.style?.length ?? 0) > 0 ||
    (filters.movement?.length ?? 0) > 0 ||
    (filters.condition?.length ?? 0) > 0 ||
    (filters.dealer?.length ?? 0) > 0 ||
    !!filters.q ||
    filters.minPrice != null ||
    filters.maxPrice != null
  );
}

/** Build a /browse URL preserving current filters but overriding page. */
export function buildPageUrl(filters: BrowseFilters, targetPage: number): string {
  const sp = new URLSearchParams();
  if (filters.q)        sp.set('q', filters.q);
  if (filters.sort && filters.sort !== 'newest') sp.set('sort', filters.sort);
  if (filters.minPrice) sp.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) sp.set('maxPrice', String(filters.maxPrice));
  filters.brand?.forEach(v     => sp.append('brand',     v));
  filters.style?.forEach(v     => sp.append('style',     v));
  filters.movement?.forEach(v  => sp.append('movement',  v));
  filters.condition?.forEach(v => sp.append('condition', v));
  filters.dealer?.forEach(v    => sp.append('dealer',    v));
  if (targetPage > 1) sp.set('page', String(targetPage));

  const qs = sp.toString();
  return qs ? `/browse?${qs}` : '/browse';
}
