// src/app/api/admin/scrape/route.ts
// Triggers a scrape job for one or all active sources.
// Protected — admin only in production.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { runScrapeJob } from '@/lib/scraper/scrape-runner';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim());

function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  if (process.env.NODE_ENV === 'development') return true; // allow all in dev
  return ADMIN_EMAILS.includes(email);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { sourceId, all, debug, noPlaywright, maxPages } = await req.json().catch(() => ({}));

  // Apply request-level overrides so adapters pick them up via process.env
  if (noPlaywright) process.env.SCRAPER_NO_PLAYWRIGHT = 'true';
  if (maxPages) process.env.SCRAPER_MAX_PAGES = String(maxPages);
  if (debug) process.env.SCRAPER_DEBUG = 'true';

  if (all) {
    const sources = await prisma.dealerSource.findMany({ where: { isActive: true } });
    // Run sequentially in background to avoid spawning multiple Playwright instances simultaneously
    ;(async () => {
      for (const source of sources) {
        try {
          await runScrapeJob(source.id);
        } catch (err) {
          console.error(`Scrape job failed for ${source.id}:`, err);
        }
      }
    })();
    return NextResponse.json({ queued: sources.length, sourceIds: sources.map(s => s.id) });
  }

  if (!sourceId)
    return NextResponse.json({ error: 'sourceId or all:true required' }, { status: 400 });

  if (debug) {
    // Await and return full result for debugging
    const result = await runScrapeJob(sourceId);
    return NextResponse.json({ sourceId, result });
  }

  // Fire in background
  runScrapeJob(sourceId).catch(console.error);
  return NextResponse.json({ queued: 1, sourceId });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const recentJobs = await prisma.scrapeJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      source: { select: { name: true, slug: true } },
      logs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  return NextResponse.json({ jobs: recentJobs });
}
