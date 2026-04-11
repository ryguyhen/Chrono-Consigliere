// src/lib/format.ts
// Shared text-formatting utilities used across the app and scraper pipeline.

/**
 * Format a price stored in cents into a display string with comma-separated
 * thousands. Handles USD, EUR, JPY, and GBP. Returns 'Price on request' when
 * cents is null or zero.
 *
 * @param cents    - price in the smallest currency unit (e.g. 1250000 = $12,500)
 * @param currency - ISO 4217 code; defaults to 'USD'
 */
export function formatPrice(cents: number | null, currency = 'USD'): string {
  if (cents == null || cents <= 0) return 'Price on request';
  const amount = cents / 100;
  if (currency === 'JPY') return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
  if (currency === 'EUR') return `€${amount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
  if (currency === 'GBP') return `£${amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Decode HTML entities in a plain-text string.
 *
 * Handles:
 *   - Named entities: &amp; &lt; &gt; &quot; &apos;
 *   - Decimal numeric entities: &#8220; &#8221; &#39; etc.
 *   - Hex numeric entities: &#x201C; &#x2019; etc.
 *
 * Safe to call on already-decoded strings (idempotent — won't double-decode
 * because after the first pass no `&...;` sequences remain).
 */
/**
 * Format a Date as a compact relative time string (e.g. "just now", "3m", "2h", "5d").
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Human-readable relative time for dates, suitable for listing age ("Added 3 days ago").
 * Uses longer form than timeAgo for readability in prose contexts.
 */
export function timeAgoLong(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Resize a Shopify CDN image URL by injecting Shopify's `_Nx` size suffix.
 *
 * Shopify CDN serves pre-resized images at URLs like `image_600x.jpg` — no extra
 * infrastructure needed. This lets Next.js Image optimizer fetch a small source
 * instead of a full-resolution upload (often 1500px+), which is the primary cause
 * of slow cold-cache browse images.
 *
 * Non-Shopify URLs are returned unchanged.
 *
 * Examples:
 *   image.jpg            → image_600x.jpg
 *   image_1024x1024.jpg  → image_600x.jpg   (strips existing size suffix)
 *   image.jpg?v=12345    → image_600x.jpg?v=12345
 *   https://example.com/ → unchanged
 */
export function shopifyThumbnailUrl(url: string, width = 600): string {
  if (!url.includes('cdn.shopify.com')) return url;
  // Strip any existing _NNNx or _NNNxNNN suffix, then inject the desired width
  return url.replace(/(_\d+x\d*)?(\.[\w]+)(\?|$)/, `_${width}x$2$3`);
}

export function decodeHtmlEntities(text: string): string {
  return text
    // Named entities first
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Hex numeric entities (e.g. &#x201C;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decimal numeric entities (e.g. &#8220; &#39; &#160;)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}
