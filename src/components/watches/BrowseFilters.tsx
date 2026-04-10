// src/components/watches/BrowseFilters.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

interface FilterOption { value: string; count: number; label?: string; }

interface FilterOptions {
  brands: FilterOption[];
  styles: FilterOption[];
  movements: FilterOption[];
  conditions: FilterOption[];
  dealers: FilterOption[];
}

const STYLE_LABELS: Record<string, string> = {
  DRESS: 'Dress', SPORT: 'Sport', DIVE: 'Dive', CHRONOGRAPH: 'Chronograph',
  FIELD: 'Field', GMT: 'GMT', PILOT: 'Pilot', INTEGRATED_BRACELET: 'Integrated Bracelet',
  VINTAGE: 'Vintage', TONNEAU: 'Tonneau', SKELETON: 'Skeleton',
};

const CONDITION_LABELS: Record<string, string> = {
  UNWORN: 'Unworn', MINT: 'Mint', EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good', GOOD: 'Good', FAIR: 'Fair',
};

const MOVEMENT_LABELS: Record<string, string> = {
  AUTOMATIC: 'Automatic', MANUAL: 'Manual Wind', QUARTZ: 'Quartz', SPRINGDRIVE: 'Spring Drive',
};

// ─── Shared hook ──────────────────────────────────────────────────────────────

function useFilterState() {
  const router = useRouter();
  const params = useSearchParams();

  const updateParam = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    const existing = next.getAll(key);
    if (existing.includes(value)) {
      next.delete(key);
      existing.filter(v => v !== value).forEach(v => next.append(key, v));
    } else {
      next.append(key, value);
    }
    next.delete('page');
    router.push(`/browse?${next.toString()}`);
  }, [params, router]);

  const isActive = (key: string, value: string) => params.getAll(key).includes(value);

  const activeCount = ['brand', 'style', 'movement', 'condition', 'dealer'].reduce(
    (sum, key) => sum + params.getAll(key).length, 0
  ) + (params.get('minPrice') ? 1 : 0) + (params.get('maxPrice') ? 1 : 0);

  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';

  function updatePrice(key: 'minPrice' | 'maxPrice', val: string) {
    const next = new URLSearchParams(params.toString());
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    router.push(`/browse?${next.toString()}`);
  }

  return { updateParam, isActive, activeCount, minPrice, maxPrice, updatePrice };
}

// ─── Shared filter panel content ───────────────────────────────────────────────

function FilterPanelContent({
  brands, styles, movements, conditions, dealers,
  updateParam, isActive, minPrice, maxPrice, updatePrice,
}: FilterOptions & ReturnType<typeof useFilterState>) {
  function FilterSection({ title, items, paramKey, labelMap }: {
    title: string;
    items: FilterOption[];
    paramKey: string;
    labelMap?: Record<string, string>;
  }) {
    if (!items.length) return null;
    return (
      <div className="mb-6">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-3">{title}</div>
        <div className="space-y-px">
          {items.map(item => {
            const active = isActive(paramKey, item.value);
            return (
              <button
                key={item.value}
                onClick={() => updateParam(paramKey, item.value)}
                role="checkbox"
                aria-checked={active}
                className={`w-full flex items-center gap-2 py-2 sm:py-1.5 text-left text-[13px] sm:text-[12px] transition-colors
                  ${active ? 'text-gold' : 'text-ink/65 hover:text-ink'}`}
              >
                <span className={`w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[7px]
                  ${active ? 'bg-gold border-gold text-ink' : 'border-ink/20'}`}>
                  {active ? '✓' : ''}
                </span>
                <span className="flex-1 truncate">{labelMap?.[item.value] ?? item.label ?? item.value}</span>
                <span className="font-mono text-[9px] text-muted/60">{item.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <FilterSection title="Brand" items={brands} paramKey="brand" />
      <FilterSection title="Style" items={styles} paramKey="style" labelMap={STYLE_LABELS} />
      <div className="mb-6">
        <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-3">Price</div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={minPrice}
            onBlur={e => updatePrice('minPrice', e.target.value)}
            className="flex-1 px-2 py-1.5 text-[12px] border border-[var(--border)] rounded bg-cream text-ink outline-none focus:border-gold w-0 min-w-0"
          />
          <span className="text-muted text-[11px]" aria-hidden="true">–</span>
          <input
            type="number"
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={maxPrice}
            onBlur={e => updatePrice('maxPrice', e.target.value)}
            className="flex-1 px-2 py-1.5 text-[12px] border border-[var(--border)] rounded bg-cream text-ink outline-none focus:border-gold w-0 min-w-0"
          />
        </div>
      </div>
      <FilterSection title="Movement" items={movements} paramKey="movement" labelMap={MOVEMENT_LABELS} />
      <FilterSection title="Condition" items={conditions} paramKey="condition" labelMap={CONDITION_LABELS} />
      <FilterSection title="Dealer" items={dealers} paramKey="dealer" />
    </>
  );
}

// ─── Desktop sidebar ───────────────────────────────────────────────────────────

export function BrowseFilters(props: FilterOptions) {
  const filterState = useFilterState();

  return (
    <aside className="hidden md:block w-[200px] flex-shrink-0 bg-surface border-r border-[var(--border)] h-[calc(100vh-52px)] sticky top-[52px] overflow-y-auto px-5 py-6">
      <FilterPanelContent {...props} {...filterState} />
    </aside>
  );
}

// ─── Mobile filter button (inline in header) + bottom sheet ───────────────────

export function MobileFilterButton(props: FilterOptions) {
  const [open, setOpen] = useState(false);
  const filterState = useFilterState();
  const { activeCount } = filterState;

  return (
    <>
      {/* Trigger — rendered inline in the search bar row */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open filters"
        className="md:hidden flex items-center gap-1.5 px-3 py-2 text-[12px] border border-[var(--border)] rounded bg-parchment text-ink whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="bg-gold text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative bg-surface rounded-t-2xl flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-ink/15" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 pt-4 pb-3 flex-shrink-0">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Filters</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink text-xl leading-none -mr-2"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-5 pb-4">
              <FilterPanelContent {...props} {...filterState} />
            </div>

            {/* Sticky done button */}
            <div
              className="flex-shrink-0 px-5 pt-3 border-t border-[var(--border)] bg-surface"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 bg-gold text-black font-mono text-[10px] tracking-[0.12em] uppercase font-bold rounded"
              >
                Done{activeCount > 0 ? ` · ${activeCount} active` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
