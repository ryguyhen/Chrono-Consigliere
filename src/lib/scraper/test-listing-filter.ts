// src/lib/scraper/test-listing-filter.ts
// Filters test/placeholder listings from scrape results before DB persistence.
// Uses a two-tier approach:
//   - Strong signals: single match → exclude
//   - Moderate signals: title signal + one corroborating signal → exclude
// Conservative by design — only exclude when confident.

import type { ScrapedListing } from './base-adapter';

export interface TestListingExclusion {
  title: string;
  sourceUrl: string;
  reason: string;
}

export interface TestListingFilterResult {
  filtered: ScrapedListing[];
  excluded: TestListingExclusion[];
}

// Strong: a single match on the title is sufficient to exclude.
// These phrases have no plausible appearance in a real luxury watch listing.
const STRONG_TITLE_PATTERNS: RegExp[] = [
  /^\s*test\s*$/i,                                  // title is exactly "test"
  /^\s*testing\s*$/i,                               // title is exactly "testing"
  /^\s*dummy\s*$/i,
  /^\s*placeholder\s*$/i,
  /^\s*example\s+(product|listing|item|watch)?\s*$/i,
  /\bdo\s*not\s*buy\b/i,
  /\btest\s+(listing|product|item|watch)\b/i,
  /\bdummy\s+(listing|product|item|watch)\b/i,
  /\bplaceholder\s+(listing|product|item|watch|product)?\b/i,
  /\[test\]/i,                                      // [TEST] prefix/suffix
  /\(test\)/i,                                      // (TEST) in title
  /\btest\s*-\s*do\s*not\s*publish\b/i,
  /\binternal\s+test\b/i,
  /\bqa\s+test\b/i,
];

// Strong URL slug patterns (extract path portion of sourceUrl)
const STRONG_SLUG_PATTERNS: RegExp[] = [
  /[/\-_]test[- _/]?(listing|product|item|watch)?($|[/\-_?#])/i,
  /[/\-_]placeholder[- _/]/i,
  /[/\-_]dummy[- _/]/i,
];

// Moderate title signals — need one corroborating signal to exclude
const MODERATE_TITLE_PATTERNS: RegExp[] = [
  /\btest\b/i,         // "test" as a word — very unlikely in a real watch title
  /\btesting\b/i,
  /\bdummy\b/i,
  /\bsample\b/i,       // "sample" is slightly riskier; needs corroboration
  /\bdraft\b/i,        // "draft" could appear legitimately; needs corroboration
  /\bexample\b/i,
];

// Corroborating signals for moderate title matches
function hasCorroboratingSignal(listing: ScrapedListing): string | null {
  const desc = (listing.description ?? '').toLowerCase();
  const slug = extractSlug(listing.sourceUrl).toLowerCase();

  // Suspicious description language
  const descTestPhrases = [
    'test listing', 'do not buy', 'placeholder', 'dummy data',
    'sample data', 'testing purposes', 'internal use', 'do not publish',
    'not for sale', 'test product', 'test item',
  ];
  for (const phrase of descTestPhrases) {
    if (desc.includes(phrase)) return `desc:"${phrase}"`;
  }

  // Slug contains test terms
  if (/\btest\b/.test(slug)) return 'slug:test';
  if (/\bdummy\b/.test(slug)) return 'slug:dummy';
  if (/\bplaceholder\b/.test(slug)) return 'slug:placeholder';
  if (/\bsample\b/.test(slug)) return 'slug:sample';

  // Suspiciously low price (< $5) — alone not meaningful, but confirms test signal
  if (listing.price !== null && listing.price < 500) return `price:${listing.price}¢`;

  // No images at all — combined with a test title pattern, strongly suggests a test
  if (!listing.images || listing.images.length === 0) return 'no-images';

  return null;
}

function extractSlug(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function filterTestListings(listings: ScrapedListing[]): TestListingFilterResult {
  const filtered: ScrapedListing[] = [];
  const excluded: TestListingExclusion[] = [];

  for (const listing of listings) {
    const title = listing.sourceTitle ?? '';
    const result = classifyListing(title, listing);
    if (result) {
      excluded.push({ title, sourceUrl: listing.sourceUrl, reason: result });
    } else {
      filtered.push(listing);
    }
  }

  return { filtered, excluded };
}

function classifyListing(title: string, listing: ScrapedListing): string | null {
  // --- Tier 1: Strong title patterns ---
  for (const pattern of STRONG_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      return `strong-title:${pattern.source.slice(0, 40)}`;
    }
  }

  // --- Tier 1: Strong slug patterns ---
  const slug = extractSlug(listing.sourceUrl);
  for (const pattern of STRONG_SLUG_PATTERNS) {
    if (pattern.test(slug)) {
      return `strong-slug:${pattern.source.slice(0, 40)}`;
    }
  }

  // --- Tier 2: Moderate title + corroboration ---
  for (const pattern of MODERATE_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      const corroboration = hasCorroboratingSignal(listing);
      if (corroboration) {
        return `moderate-title+${corroboration}`;
      }
    }
  }

  return null;
}

/**
 * Log summary of test-listing exclusions. Call after filterTestListings().
 */
export function summarizeExclusions(
  excluded: TestListingExclusion[],
  log: (msg: string) => void,
  debug = false,
): void {
  if (excluded.length === 0) return;

  // Count by reason category
  const reasonCounts: Record<string, number> = {};
  for (const e of excluded) {
    const category = e.reason.split(':')[0];
    reasonCounts[category] = (reasonCounts[category] ?? 0) + 1;
  }

  const reasonSummary = Object.entries(reasonCounts)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');

  const samples = excluded.slice(0, 3).map(e => `"${e.title.slice(0, 50)}"`).join(', ');
  log(`Test listings excluded: ${excluded.length} (${reasonSummary}) — e.g. ${samples}`);

  if (debug && excluded.length > 3) {
    for (const e of excluded.slice(3)) {
      log(`  test-excluded: "${e.title.slice(0, 60)}" [${e.reason}] ${e.sourceUrl}`);
    }
  }
}
