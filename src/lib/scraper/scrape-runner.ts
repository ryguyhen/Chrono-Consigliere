// src/lib/scraper/scrape-runner.ts
// Orchestrates a scrape job: runs the adapter, deduplicates, persists to DB,
// marks stale listings as unavailable.
// DISCLAIMER: Listings link to original dealer sites. Chrono Consigliere is not a seller.

import { prisma } from '@/lib/db';
import { getAdapter } from './adapter-registry';
import type { ScrapedListing } from './base-adapter';

export async function runScrapeJob(sourceId: string): Promise<void> {
  // Create job record
  const job = await prisma.scrapeJob.create({
    data: { sourceId, status: 'RUNNING', startedAt: new Date() },
  });

  const source = await prisma.dealerSource.findUniqueOrThrow({
    where: { id: sourceId },
  });

  const adapter = getAdapter(source.adapterName);
  if (!adapter) {
    await failJob(job.id, `No adapter registered for: ${source.adapterName}`);
    return;
  }

  try {
    const result = await adapter.scrape();

    // Process each listing
    let newCount = 0;
    let updatedCount = 0;
    const scrapedUrls = new Set<string>();

    for (const listing of result.listings) {
      scrapedUrls.add(listing.sourceUrl);
      const upserted = await upsertListing(listing, sourceId);
      if (upserted === 'created') newCount++;
      else if (upserted === 'updated') updatedCount++;
    }

    // Mark any previously-active listings that didn't appear in this scrape as unavailable
    const removed = await prisma.watchListing.updateMany({
      where: {
        sourceId,
        isAvailable: true,
        sourceUrl: { notIn: Array.from(scrapedUrls) },
      },
      data: { isAvailable: false },
    });

    // Update job as complete
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        listingsFound: result.listings.length,
        listingsNew: newCount,
        listingsRemoved: removed.count,
        errorMessage: result.errors.length > 0 ? result.errors.slice(0, 3).join(' | ') : null,
      },
    });

    // Update source lastSyncAt
    await prisma.dealerSource.update({
      where: { id: sourceId },
      data: { lastSyncAt: new Date() },
    });

  } catch (err: any) {
    await failJob(job.id, err.message);
  }
}

async function upsertListing(
  listing: ScrapedListing,
  sourceId: string
): Promise<'created' | 'updated' | 'skipped'> {
  const existing = await prisma.watchListing.findUnique({
    where: { sourceUrl: listing.sourceUrl },
  });

  const data = {
    sourceId,
    isAvailable: listing.isAvailable,
    lastCheckedAt: new Date(),
    brand: listing.brand || 'Unknown',
    model: listing.model || listing.sourceTitle,
    reference: listing.reference,
    year: listing.year,
    caseSizeMm: listing.caseSizeMm,
    caseMaterial: listing.caseMaterial,
    dialColor: listing.dialColor,
    movementType: listing.movementType,
    condition: listing.condition,
    style: undefined as any, // enriched separately
    price: listing.price,
    currency: listing.currency,
    description: listing.description,
    sourceTitle: listing.sourceTitle,
    sourcePrice: listing.sourcePrice,
  };

  if (existing) {
    await prisma.watchListing.update({ where: { id: existing.id }, data });
    return 'updated';
  }

  const created = await prisma.watchListing.create({
    data: { ...data, sourceUrl: listing.sourceUrl },
  });

  // Create images
  if (listing.images?.length) {
    await prisma.watchImage.createMany({
      data: listing.images.map(img => ({
        listingId: created.id,
        url: img.url,
        isPrimary: img.isPrimary,
      })),
    });
  }

  // Check for duplicates by reference number
  if (listing.reference) {
    const possibleDupe = await prisma.watchListing.findFirst({
      where: {
        reference: listing.reference,
        brand: data.brand,
        id: { not: created.id },
        isAvailable: true,
      },
    });
    if (possibleDupe) {
      await prisma.watchListing.update({
        where: { id: created.id },
        data: { duplicateOf: possibleDupe.id },
      });
    }
  }

  return 'created';
}

async function failJob(jobId: string, message: string): Promise<void> {
  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorMessage: message,
    },
  });
}
