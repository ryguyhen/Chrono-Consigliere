#!/usr/bin/env ts-node
// scripts/run-all-scrapers.ts
// Runs all active dealer scrapers in sequence with polite intervals.
// Usage: npx ts-node scripts/run-all-scrapers.ts
//        npx ts-node scripts/run-all-scrapers.ts --parallel   (concurrent — use carefully)

import { PrismaClient } from '@prisma/client';
import { runScrapeJob } from '../src/lib/scraper/scrape-runner';
import { listRegisteredAdapters } from '../src/lib/scraper/adapter-registry';

const prisma = new PrismaClient();

const PARALLEL = process.argv.includes('--parallel');
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE_FILTER = process.argv.find(a => a.startsWith('--source='))?.split('=')[1];

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Chrono Consigliere — Scraper Runner    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const sources = await prisma.dealerSource.findMany({
    where: {
      isActive: true,
      ...(SOURCE_FILTER ? { slug: SOURCE_FILTER } : {}),
    },
    orderBy: { name: 'asc' },
  });

  const registered = listRegisteredAdapters();
  const runnable = sources.filter(s => registered.includes(s.adapterName));
  const skipped = sources.filter(s => !registered.includes(s.adapterName));

  console.log(`Found ${sources.length} active sources`);
  console.log(`Runnable: ${runnable.length} | Skipped (no adapter): ${skipped.length}`);
  if (skipped.length) {
    console.log(`  Skipped: ${skipped.map(s => s.name).join(', ')}`);
  }
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would scrape:');
    runnable.forEach(s => console.log(`  → ${s.name} (${s.adapterName})`));
    return;
  }

  console.log(`\nMode: ${PARALLEL ? 'parallel' : 'sequential'}\n`);

  const results: { name: string; status: 'ok' | 'error'; listings?: number; error?: string }[] = [];

  if (PARALLEL) {
    await Promise.allSettled(
      runnable.map(async source => {
        try {
          console.log(`[START] ${source.name}`);
          await runScrapeJob(source.id);
          console.log(`[DONE ] ${source.name}`);
          results.push({ name: source.name, status: 'ok' });
        } catch (err: any) {
          console.error(`[FAIL ] ${source.name}: ${err.message}`);
          results.push({ name: source.name, status: 'error', error: err.message });
        }
      })
    );
  } else {
    for (const source of runnable) {
      console.log(`\n[${new Date().toISOString()}] Starting: ${source.name}`);
      try {
        await runScrapeJob(source.id);
        const count = await prisma.watchListing.count({
          where: { sourceId: source.id, isAvailable: true },
        });
        console.log(`  ✓ Done — ${count} active listings`);
        results.push({ name: source.name, status: 'ok', listings: count });
      } catch (err: any) {
        console.error(`  ✗ Failed: ${err.message}`);
        results.push({ name: source.name, status: 'error', error: err.message });
      }
      // Polite pause between sources (2–5s random)
      if (source !== runnable[runnable.length - 1]) {
        const pause = 2000 + Math.random() * 3000;
        await new Promise(r => setTimeout(r, pause));
      }
    }
  }

  // Summary
  console.log('\n\n╔══════════════════════════════════════════╗');
  console.log('║              Scrape Summary              ║');
  console.log('╚══════════════════════════════════════════╝');
  const ok = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status === 'error');
  console.log(`  ✓ Success: ${ok.length}`);
  console.log(`  ✗ Failed:  ${failed.length}`);
  if (failed.length) {
    console.log('\nFailed sources:');
    failed.forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }

  const total = await prisma.watchListing.count({ where: { isAvailable: true } });
  console.log(`\nTotal in-stock listings: ${total.toLocaleString()}\n`);
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
