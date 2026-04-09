// scripts/scrape-direct.ts
// Standalone scraper entrypoint for the dedicated Railway scraper service.
// Runs all active sources sequentially, writing results directly to the DB.
// Does NOT go through the Next.js HTTP layer — Playwright is used in-process.
//
// Run:
//   npm run scrape:cron
//   (which calls: ts-node --project tsconfig.scripts.json scripts/scrape-direct.ts)
//
// Env vars required:
//   DATABASE_URL   — PostgreSQL connection string (same as web service)
//
// Optional:
//   SCRAPER_NO_PLAYWRIGHT=true   — skip Playwright-dependent sources
//   SCRAPER_MAX_PAGES=N          — cap pagination (useful for low-memory runs)
//   SCRAPER_DEBUG=true           — verbose funnel logging
//   SCRAPER_DEBUG_SOURCE=<Name>  — debug a single adapter by class name

import { prisma } from '@/lib/db';
import { runScrapeJob } from '@/lib/scraper/scrape-runner';

function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
  const ts = new Date().toISOString();
  const fn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  fn(`[${ts}] ${level.padEnd(5)} scrape-direct: ${msg}`);
}

async function main() {
  log('INFO', 'Starting scheduled scrape run');

  const sources = await prisma.dealerSource.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, adapterName: true },
  });

  log('INFO', `${sources.length} active sources: ${sources.map(s => s.name).join(', ')}`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    log('INFO', `[${i + 1}/${sources.length}] Starting: ${source.name} (${source.adapterName})`);

    try {
      const result = await runScrapeJob(source.id);

      if (result.status === 'COMPLETED') {
        log('INFO', `[${i + 1}/${sources.length}] Completed: ${source.name} — ${result.listingsFound} found, ${result.listingsNew} new, ${result.listingsRemoved} removed`);
        if (result.errors.length > 0) {
          log('WARN', `  ${source.name} completed with ${result.errors.length} non-fatal error(s): ${result.errors[0]}`);
        }
        completed++;
      } else {
        log('ERROR', `[${i + 1}/${sources.length}] Failed: ${source.name} — ${result.errors[0] ?? 'unknown error'}`);
        failed++;
      }
    } catch (err: any) {
      const cause = err.cause;
      const causeDetail = cause ? ` [cause: ${cause.code ?? cause.message ?? String(cause)}]` : '';
      log('ERROR', `[${i + 1}/${sources.length}] Uncaught exception: ${source.name} — ${err.message}${causeDetail}`);
      failed++;
      // Continue with remaining sources
    }

    // Polite inter-source pause (skip after last source)
    if (i < sources.length - 1) {
      const pause = 3000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, pause));
    }
  }

  log('INFO', `Run complete — ${completed}/${sources.length} succeeded, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async err => {
  log('ERROR', `Fatal: ${err.message}`);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
