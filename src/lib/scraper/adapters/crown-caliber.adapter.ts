// src/lib/scraper/adapters/crown-caliber.adapter.ts
// Adapter for crownandcaliber.com
// DISCLAIMER: All watches link back to Crown & Caliber for purchase.
// Chrono Consigliere does not sell watches.

import { chromium } from 'playwright';
import { BaseAdapter, type ScrapeResult, type ScrapedListing } from '../base-adapter';

export class CrownCaliberAdapter extends BaseAdapter {
  constructor() {
    super({
      sourceId: '', // filled in by scrape runner from DB
      sourceName: 'Crown & Caliber',
      baseUrl: 'https://www.crownandcaliber.com',
      rateLimit: 2500,
      maxRetries: 3,
      maxPages: 60,
    });
  }

  async scrape(): Promise<ScrapeResult> {
    const listings: ScrapedListing[] = [];
    const errors: string[] = [];

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport: { width: 1280, height: 800 },
    });

    try {
      const page = await context.newPage();
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= this.config.maxPages!) {
        const url = `${this.config.baseUrl}/collections/all?page=${currentPage}&sort_by=created-descending`;
        this.log('info', `Scraping page ${currentPage}: ${url}`);

        await this.withRetry(async () => {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        });

        // Wait for product grid
        const hasProducts = await page.locator('.product-card').count();
        if (hasProducts === 0) {
          hasMore = false;
          break;
        }

        const pageListings = await page.evaluate(() => {
          const cards = document.querySelectorAll('.product-card');
          const results: any[] = [];

          cards.forEach(card => {
            const linkEl = card.querySelector('a[href*="/products/"]') as HTMLAnchorElement;
            const priceEl = card.querySelector('.price');
            const titleEl = card.querySelector('.product-card__title');
            const imgEl = card.querySelector('img') as HTMLImageElement;
            const badgeEl = card.querySelector('.badge');

            // Skip sold listings — Crown & Caliber marks them with a "Sold" badge
            if (badgeEl?.textContent?.toLowerCase().includes('sold')) return;

            if (!linkEl) return;

            results.push({
              sourceUrl: window.location.origin + linkEl.pathname,
              sourceTitle: titleEl?.textContent?.trim() || '',
              sourcePrice: priceEl?.textContent?.trim() || null,
              primaryImageUrl: imgEl?.src || imgEl?.dataset.src || null,
              isAvailable: true,
            });
          });

          return results;
        });

        // For each listing URL, fetch the detail page to get full specs
        for (const partial of pageListings) {
          try {
            await this.delay();
            const full = await this.scrapeDetailPage(page, partial.sourceUrl);
            listings.push({ ...partial, ...full });
          } catch (err: any) {
            this.log('warn', `Failed detail for ${partial.sourceUrl}: ${err.message}`);
            errors.push(partial.sourceUrl);
          }
        }

        currentPage++;
        await this.delay();
      }
    } catch (err: any) {
      this.log('error', `Fatal scrape error: ${err.message}`);
      errors.push(err.message);
    } finally {
      await browser.close();
    }

    this.log('info', `Completed. ${listings.length} listings found, ${errors.length} errors`);
    return { listings, totalFound: listings.length, errors };
  }

  private async scrapeDetailPage(page: any, url: string): Promise<Partial<ScrapedListing>> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    return await page.evaluate(() => {
      const getText = (sel: string) =>
        document.querySelector(sel)?.textContent?.trim() || null;

      const getSpecValue = (label: string): string | null => {
        const rows = document.querySelectorAll('.product-spec, .spec-row, [data-spec]');
        for (const row of rows) {
          const rowText = row.textContent || '';
          if (rowText.toLowerCase().includes(label.toLowerCase())) {
            const val = row.querySelector('.spec-value, td:last-child');
            return val?.textContent?.trim() || null;
          }
        }
        return null;
      };

      const images = Array.from(document.querySelectorAll('.product-image img, .gallery img'))
        .map((img: any, i) => ({
          url: img.src || img.dataset.src || '',
          isPrimary: i === 0,
        }))
        .filter(img => img.url);

      // Extract brand from title or breadcrumb
      const titleEl = document.querySelector('h1.product-title, h1');
      const title = titleEl?.textContent?.trim() || '';
      const breadcrumbs = Array.from(document.querySelectorAll('.breadcrumb a'))
        .map((a: any) => a.textContent?.trim())
        .filter(Boolean);

      return {
        sourceTitle: title,
        brand: getSpecValue('Brand') || breadcrumbs[1] || null,
        model: getSpecValue('Model') || null,
        reference: getSpecValue('Reference') || getSpecValue('Ref') || null,
        year: parseInt(getSpecValue('Year') || '0') || null,
        caseSizeMm: null, // parsed by base class from raw string
        caseMaterial: getSpecValue('Case Material') || getSpecValue('Material') || null,
        dialColor: getSpecValue('Dial Color') || getSpecValue('Dial') || null,
        condition: getSpecValue('Condition') || null,
        description: getText('.product-description, .description') || null,
        images,
      };
    });
  }
}
