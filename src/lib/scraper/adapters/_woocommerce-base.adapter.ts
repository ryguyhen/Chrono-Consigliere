// src/lib/scraper/adapters/_woocommerce-base.adapter.ts
// Reusable base for WooCommerce-powered dealer sites.
// WooCommerce exposes a public REST API at /wp-json/wc/v3/products
// (requires consumer key/secret for authenticated routes, but the store
// often has public product browsing enabled at /wp-json/wc/store/v1/products
// or we fall back to scraping the /shop/ page with Playwright).
// DISCLAIMER: All listings link to the original dealer site for purchase.

import { chromium } from 'playwright';
import { BaseAdapter, type ScrapeResult, type ScrapedListing } from '../base-adapter';
import { inferBrand } from '../brand-inference';

export interface WooCommerceAdapterConfig {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  shopPath?: string;       // defaults to /shop/
  productPath?: string;    // defaults to /product/
  locale?: 'en' | 'fr' | 'de' | 'jp';  // for non-English sites
  rateLimit?: number;
}

export abstract class WooCommerceBaseAdapter extends BaseAdapter {
  protected wooConfig: WooCommerceAdapterConfig;

  constructor(config: WooCommerceAdapterConfig) {
    super({
      sourceId: config.sourceId,
      sourceName: config.sourceName,
      baseUrl: config.baseUrl,
      rateLimit: config.rateLimit ?? 2500,
      maxRetries: 3,
      maxPages: 40,
    });
    this.wooConfig = config;
  }

  async scrape(): Promise<ScrapeResult> {
    const listings: ScrapedListing[] = [];
    const errors: string[] = [];

    // Try WooCommerce Store API first (no auth needed for public products)
    const storeApiUrl = `${this.wooConfig.baseUrl}/wp-json/wc/store/v1/products`;
    try {
      const storeListings = await this.scrapeViaStoreApi(storeApiUrl);
      if (storeListings.length > 0) {
        this.log('info', `Store API returned ${storeListings.length} listings`);
        return { listings: storeListings, totalFound: storeListings.length, errors };
      }
    } catch {
      this.log('info', 'Store API unavailable, falling back to Playwright scrape');
    }

    // Respect low-memory / no-Playwright mode
    if (process.env.SCRAPER_NO_PLAYWRIGHT === 'true') {
      const msg = `${this.config.sourceName}: Store API returned 0 and Playwright is disabled (SCRAPER_NO_PLAYWRIGHT=true) — skipping`;
      this.log('warn', msg);
      return { listings: [], totalFound: 0, errors: [msg] };
    }

    // Fallback: Playwright HTML scrape
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      locale: 'en-US',
      // Disable all persistence and heavy features to minimise memory on Railway
      recordVideo: undefined,
      recordHar: undefined,
      acceptDownloads: false,
      javaScriptEnabled: true,
    });

    try {
      const page = await context.newPage();
      const shopPath = this.wooConfig.shopPath ?? '/shop/';
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= this.config.maxPages!) {
        const url = currentPage === 1
          ? `${this.wooConfig.baseUrl}${shopPath}`
          : `${this.wooConfig.baseUrl}${shopPath}page/${currentPage}/`;

        this.log('info', `Scraping page ${currentPage}: ${url}`);

        await this.withRetry(() =>
          page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        );

        // Extract product links from WooCommerce product grid
        const productLinks = await page.evaluate(() => {
          const links: string[] = [];
          // WooCommerce standard selectors
          const selectors = [
            'li.product a.woocommerce-LoopProduct-link',
            '.products .product a.woocommerce-loop-product__link',
            'article.product a',
            '.woocommerce ul.products li a.woocommerce-LoopProduct-link',
          ];
          for (const sel of selectors) {
            const els = document.querySelectorAll(sel) as NodeListOf<HTMLAnchorElement>;
            if (els.length > 0) {
              els.forEach(el => {
                const href = el.href;
                if (href && !links.includes(href)) links.push(href);
              });
              break;
            }
          }
          return [...new Set(links)];
        });

        if (productLinks.length === 0) {
          hasMore = false;
          break;
        }

        // Scrape each product detail page
        for (const productUrl of productLinks) {
          try {
            await this.delay();
            const listing = await this.scrapeProductPage(page, productUrl);
            if (listing) listings.push(listing);
          } catch (err: any) {
            this.log('warn', `Failed ${productUrl}: ${err.message}`);
            errors.push(productUrl);
          }
        }

        // Check for next page
        const hasNextPage = await page.evaluate(() => {
          return !!(
            document.querySelector('.woocommerce-pagination .next') ||
            document.querySelector('a.next.page-numbers') ||
            document.querySelector('.next.page-numbers')
          );
        });

        hasMore = hasNextPage;
        currentPage++;
        await this.delay();
      }
    } finally {
      await browser.close();
    }

    this.log('info', `Done. ${listings.length} listings, ${errors.length} errors`);
    return { listings, totalFound: listings.length, errors };
  }

  private async scrapeViaStoreApi(apiUrl: string): Promise<ScrapedListing[]> {
    const listings: ScrapedListing[] = [];
    let page = 1;
    let hasMore = true;
    let inventoryZeroFiltered = 0;

    while (hasMore) {
      const url = `${apiUrl}?per_page=100&page=${page}&stock_status=instock`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Store API ${res.status}`);
      const products = await res.json() as any[];

      if (!products?.length) break;

      for (const p of products) {
        // stock_status=instock filter handles most OOS items, but some stores
        // return instock items with stock_quantity=0 (explicit zero = sold out).
        if (p.stock_quantity != null && p.stock_quantity === 0) {
          inventoryZeroFiltered++;
          continue;
        }
        const isAvailable = p.is_in_stock !== false && p.stock_status !== 'outofstock';
        const price = this.parsePrice(p.prices?.price ?? p.price ?? null);
        const description = p.short_description?.rendered ?? p.description?.rendered ?? null;
        const stripped = this.stripHtml(description);
        const parsed = this.parseFromTitleAndDescription(p.name, stripped);

        listings.push({
          sourceUrl: p.permalink,
          sourceTitle: p.name,
          sourcePrice: p.prices?.price && parseInt(p.prices.price) > 0 ? `$${(parseInt(p.prices.price) / 100).toFixed(2)}` : null,
          brand: parsed.brand ?? null,
          model: parsed.model ?? null,
          reference: parsed.reference ?? null,
          year: parsed.year ?? null,
          caseSizeMm: parsed.caseSizeMm ?? null,
          caseMaterial: parsed.caseMaterial ?? null,
          dialColor: parsed.dialColor ?? null,
          movementType: parsed.movementType ?? null,
          condition: parsed.condition ?? null,
          style: null,
          price,
          currency: 'USD',
          description: stripped,
          images: (p.images ?? []).map((img: any, i: number) => ({
            url: img.src ?? img.url,
            isPrimary: i === 0,
          })),
          isAvailable,
        });
      }

      hasMore = products.length === 100;
      page++;
      await this.delay(800);
    }

    if (inventoryZeroFiltered > 0) {
      this.log('info', `Funnel: ${inventoryZeroFiltered} excluded (qty=0), ${listings.length} listings returned`);
    }
    return listings;
  }

  protected async scrapeProductPage(
    page: any,
    url: string
  ): Promise<ScrapedListing | null> {
    await this.withRetry(() =>
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    );

    return await page.evaluate((productUrl: string) => {
      // Check if out of stock
      const outOfStockEl = document.querySelector(
        '.out-of-stock, .stock.out-of-stock, .woocommerce-variation-availability .out-of-stock'
      );
      const isAvailable = !outOfStockEl;

      const title = (
        document.querySelector('h1.product_title, h1.entry-title')?.textContent ?? ''
      ).trim();

      const priceEl = document.querySelector(
        '.price .woocommerce-Price-amount, .price ins .woocommerce-Price-amount, .price'
      );
      const sourcePrice = priceEl?.textContent?.trim() ?? null;

      const descEl = document.querySelector(
        '.woocommerce-product-details__short-description, .product-short-description, .woocommerce-Tabs-panel--description'
      );
      const description = descEl?.textContent?.trim()?.slice(0, 2000) ?? null;

      const images = Array.from(
        document.querySelectorAll('.woocommerce-product-gallery__image img, .product-images img')
      ).map((img: any, i) => ({
        url: img.dataset.large_image ?? img.src ?? '',
        isPrimary: i === 0,
      })).filter(img => img.url);

      // WooCommerce product attributes table
      const getAttr = (label: string): string | null => {
        const rows = document.querySelectorAll('.woocommerce-product-attributes tr, .product_meta span');
        for (const row of rows) {
          if (row.textContent?.toLowerCase().includes(label.toLowerCase())) {
            return (row.querySelector('td, .value')?.textContent ?? '').trim() || null;
          }
        }
        return null;
      };

      return {
        sourceUrl: productUrl,
        sourceTitle: title,
        sourcePrice,
        description,
        images,
        isAvailable,
        brand: getAttr('brand') ?? getAttr('make') ?? null,
        reference: getAttr('reference') ?? getAttr('ref') ?? getAttr('model number') ?? null,
        year: parseInt(getAttr('year') ?? '0') || null,
        caseSizeMm: parseFloat(getAttr('case size') ?? '0') || null,
        caseMaterial: getAttr('case material') ?? getAttr('material') ?? null,
        dialColor: getAttr('dial') ?? getAttr('dial color') ?? null,
        condition: getAttr('condition') ?? null,
        // These get normalized by the runner
        movementType: null,
        style: null,
        model: null,
        price: null,
        currency: 'USD',
      } as any;
    }, url);
  }

  protected stripHtml(html: string | null): string | null {
    if (!html) return null;
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
  }

  protected parseFromTitleAndDescription(
    title: string,
    description: string | null
  ): Partial<ScrapedListing> {
    // Reuse the same smart parsing from Shopify base
    const text = `${title} ${description ?? ''}`;
    const refMatch = text.match(/[Rr]ef\.?\s*#?\s*([A-Z0-9]{3,12}(?:[\/\-][A-Z0-9]{1,6})?)/);
    const yearMatch = text.match(/\b(19[0-9]{2}|20[01][0-9]|202[0-4])\b/);
    const caseMatch = text.match(/\b(\d{2}(?:\.\d)?)\s*mm\b/i);

    const brandMatch = inferBrand(title, description ?? undefined);
    const brand = brandMatch?.brand ?? null;
    const brandMatched = brandMatch?.matched ?? null;

    let model: string | null = null;
    if (brandMatched) {
      const idx = title.toLowerCase().indexOf(brandMatched.toLowerCase());
      model = title.slice(idx + brandMatched.length).trim().replace(/^[-–—\s]+/, '').slice(0, 100) || null;
    } else {
      model = title.slice(0, 100);
    }

    return {
      brand,
      model,
      reference: refMatch?.[1] ?? null,
      year: yearMatch ? parseInt(yearMatch[1]) : null,
      caseSizeMm: caseMatch ? parseFloat(caseMatch[1]) : null,
      movementType: this.normalizeMovement(text),
      condition: this.normalizeCondition(text),
    };
  }
}
