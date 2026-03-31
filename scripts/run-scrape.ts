#!/usr/bin/env ts-node
// scripts/run-scrape.ts
// Runs a single dealer scraper by slug. Writes results to DB.
//
// Usage:
//   npm run scrape:run -- --source bulang-and-sons
//   npm run scrape:run -- --source bulang-and-sons --debug
//   npm run scrape:run -- --source bulang-and-sons --no-playwright
//   npm run scrape:run -- --source bulang-and-sons --debug --max-pages 2
//
// Env vars (can also be set in Railway):
//   SCRAPER_DEBUG=true           verbose funnel logging for all sources
//   SCRAPER_DEBUG_SOURCE=Name    verbose logging for one adapter class only
//   SCRAPER_NO_PLAYWRIGHT=true   skip Playwright fallback (WooCommerce sources return 0)
//   SCRAPER_MAX_PAGES=N          cap pagination (default: 50)

import { PrismaClient } from '@prisma/client';
import { runScrapeJob } from '../src/lib/scraper/scrape-runner';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const prefixed = process.argv.find(a => a.startsWith(`${flag}=`));
  return prefixed?.split('=').slice(1).join('=');
}

const slug = getArg('--source');
const debug = process.argv.includes('--debug');
const noPlaywright = process.argv.includes('--no-playwright');
const maxPages = getArg('--max-pages');

async function main() {
  if (!slug) {
    console.error('Usage: npm run scrape:run -- --source <slug> [--debug] [--no-playwright] [--max-pages N]');
    console.error('\nAvailable slugs:');
    const sources = await prisma.dealerSource.findMany({
      select: { slug: true, name: true, adapterName: true, isActive: true },
      orderBy: { name: 'asc' },
    });
    sources.forEach(s =>
      console.error(`  ${s.slug.padEnd(32)} ${s.name.padEnd(30)} ${s.isActive ? '' : '[inactive]'}`)
    );
    process.exit(1);
  }

  // Apply env overrides from CLI flags
  if (debug) {
    process.env.SCRAPER_DEBUG = 'true';
    console.log('[debug mode enabled]');
  }
  if (noPlaywright) {
    process.env.SCRAPER_NO_PLAYWRIGHT = 'true';
    console.log('[Playwright disabled]');
  }
  if (maxPages) {
    process.env.SCRAPER_MAX_PAGES = maxPages;
    console.log(`[max pages: ${maxPages}]`);
  }

  const source = await prisma.dealerSource.findUnique({ where: { slug } });
  if (!source) {
    console.error(`No source found with slug: "${slug}"`);
    const all = await prisma.dealerSource.findMany({ select: { slug: true } });
    const close = all.filter(s => s.slug.includes(slug) || slug.includes(s.slug.split('-')[0]));
    if (close.length) console.error(`Did you mean: ${close.map(s => s.slug).join(', ')}?`);
    process.exit(1);
  }

  if (!source.isActive) {
    console.warn(`Warning: "${source.name}" is marked inactive. Proceeding anyway.`);
  }

  console.log(`\nScraping:  ${source.name}`);
  console.log(`Adapter:   ${source.adapterName}`);
  console.log(`URL:       ${source.baseUrl}`);
  console.log(`Debug:     ${debug}`);
  console.log(`Playwright:${noPlaywright ? ' disabled' : ' enabled'}`);
  console.log(`Started:   ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  try {
    const summary = await runScrapeJob(source.id);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n─────────────────────────────────────────');
    console.log(`${summary.status === 'COMPLETED' ? '✓' : '✗'} ${summary.status} in ${elapsed}s`);
    console.log(`  Listings found:   ${summary.listingsFound}`);
    console.log(`  New this run:     ${summary.listingsNew}`);
    console.log(`  Removed:          ${summary.listingsRemoved}`);

    if (summary.diagnostics) {
      const d = summary.diagnostics;
      console.log(`  Endpoint used:    ${d.endpointUsed ?? '?'}`);
      console.log(`  Pages scraped:    ${d.pagesScraped ?? '?'}`);
      console.log(`  Raw total:        ${d.rawTotal ?? '?'}`);
      console.log(`  Non-watch drop:   ${d.nonWatchFiltered ?? 0}`);
      console.log(`  Unavailable:      ${d.unavailableFiltered ?? 0}`);
      if (d.dropReasons && Object.keys(d.dropReasons).length > 0) {
        console.log(`  Drop reasons:`);
        for (const [reason, count] of Object.entries(d.dropReasons as Record<string, number>)) {
          console.log(`    ${reason}: ${count}`);
        }
      }
    }

    if (summary.errors.length > 0) {
      console.log(`\n  Errors (${summary.errors.length}):`);
      summary.errors.forEach(e => console.log(`    - ${e}`));
    }

    console.log('─────────────────────────────────────────\n');

    if (summary.status === 'FAILED') process.exit(1);
  } catch (err: any) {
    console.error(`\nFatal: ${err.message}`);
    process.exit(1);
  }
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
