#!/usr/bin/env ts-node
// scripts/run-scrape.ts
// Runs a single dealer scraper by slug.
// Usage: npx ts-node scripts/run-scrape.ts --source bulang-and-sons
//        npx ts-node scripts/run-scrape.ts --source craft-and-tailored --verbose

import { PrismaClient } from '@prisma/client';
import { runScrapeJob } from '../src/lib/scraper/scrape-runner';

const prisma = new PrismaClient();

async function main() {
  const slugArg = process.argv.find(a => a.startsWith('--source=') || a.startsWith('--source '));
  const slug = slugArg?.split(/[= ]/)[1] ?? process.argv[process.argv.indexOf('--source') + 1];

  if (!slug) {
    console.error('Usage: npx ts-node scripts/run-scrape.ts --source <slug>');
    console.error('\nAvailable slugs:');
    const sources = await prisma.dealerSource.findMany({ select: { slug: true, name: true, isActive: true } });
    sources.forEach(s => console.error(`  ${s.slug.padEnd(30)} ${s.name}${s.isActive ? '' : ' [inactive]'}`));
    process.exit(1);
  }

  const source = await prisma.dealerSource.findUnique({ where: { slug } });
  if (!source) {
    console.error(`No source found with slug: "${slug}"`);
    process.exit(1);
  }

  if (!source.isActive) {
    console.warn(`Warning: source "${source.name}" is marked inactive. Proceeding anyway.`);
  }

  console.log(`\nScraping: ${source.name}`);
  console.log(`URL:      ${source.baseUrl}`);
  console.log(`Adapter:  ${source.adapterName}`);
  console.log(`Started:  ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  try {
    await runScrapeJob(source.id);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const stats = await prisma.watchListing.aggregate({
      where: { sourceId: source.id },
      _count: { id: true },
    });
    const available = await prisma.watchListing.count({
      where: { sourceId: source.id, isAvailable: true },
    });
    const lastJob = await prisma.scrapeJob.findFirst({
      where: { sourceId: source.id },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n─────────────────────────────');
    console.log(`✓ Complete in ${elapsed}s`);
    console.log(`  Total listings:     ${stats._count.id}`);
    console.log(`  In-stock listings:  ${available}`);
    if (lastJob) {
      console.log(`  New this run:       ${lastJob.listingsNew ?? 0}`);
      console.log(`  Removed this run:   ${lastJob.listingsRemoved ?? 0}`);
    }
    console.log('─────────────────────────────\n');
  } catch (err: any) {
    console.error(`\n✗ Scrape failed: ${err.message}`);
    process.exit(1);
  }
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
