// src/lib/social/feed-service.ts
// Handles social event creation and feed fanout.
// When a user likes, saves, or purchases, feed events are written
// for all followers of that user.

import { prisma } from '@/lib/db';
import type { FeedEventType } from '@prisma/client';

export async function emitFeedEvent({
  actorId,
  type,
  listingId,
  metadata,
}: {
  actorId: string;
  type: FeedEventType;
  listingId?: string;
  metadata?: Record<string, string>;
}) {
  const event = await prisma.activityFeedEvent.create({
    data: {
      actorId,
      type,
      listingId,
      metadata,
    },
  });

  // If this is a purchase, check for influence events:
  // Did any followed users like/save this watch before the buyer did?
  if (type === 'PURCHASED' && listingId) {
    await checkAndEmitInfluenceEvents(actorId, listingId);
  }

  return event;
}

async function checkAndEmitInfluenceEvents(buyerId: string, listingId: string) {
  const following = await prisma.follow.findMany({
    where: { followerId: buyerId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);
  if (!followingIds.length) return;

  // Find friends who liked or saved this listing
  const [friendLikes, friendSaves] = await Promise.all([
    prisma.like.findMany({
      where: { listingId, userId: { in: followingIds } },
      select: { userId: true },
    }),
    prisma.wishlistItem.findMany({
      where: { listingId, userId: { in: followingIds } },
      select: { userId: true },
    }),
  ]);

  const influencerIds = [
    ...new Set([
      ...friendLikes.map(l => l.userId),
      ...friendSaves.map(s => s.userId),
    ]),
  ];

  if (!influencerIds.length) return;

  // Bulk-create all influence events in one query
  await prisma.activityFeedEvent.createMany({
    data: influencerIds.map(influencerId => ({
      actorId: buyerId,
      targetUserId: influencerId,
      type: 'INFLUENCED_PURCHASE' as FeedEventType,
      listingId,
      metadata: { influencedBy: influencerId },
    })),
    skipDuplicates: true,
  });
}

export async function getFeedForUser(userId: string, cursor?: string, limit = 20) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);

  return prisma.activityFeedEvent.findMany({
    where: {
      actorId: { in: followingIds },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: {
      actor: { include: { profile: true } },
      listing: { include: { images: { where: { isPrimary: true } }, source: true } },
    },
  });
}

export async function getTasteOverlap(userId: string, friendId: string) {
  // Fetch both users' engagement in two queries (user+friend likes/saves each)
  // rather than four separate per-user queries.
  const [myEngagement, friendEngagement] = await Promise.all([
    prisma.$queryRaw<{ listingId: string }[]>`
      SELECT "listingId" FROM "Like" WHERE "userId" = ${userId}
      UNION
      SELECT "listingId" FROM "WishlistItem" WHERE "userId" = ${userId}
    `,
    prisma.$queryRaw<{ listingId: string }[]>`
      SELECT "listingId" FROM "Like" WHERE "userId" = ${friendId}
      UNION
      SELECT "listingId" FROM "WishlistItem" WHERE "userId" = ${friendId}
    `,
  ]);

  const myIds = new Set(myEngagement.map(r => r.listingId));
  const friendIds = new Set(friendEngagement.map(r => r.listingId));
  const overlapIds = [...myIds].filter(id => friendIds.has(id));

  if (!overlapIds.length) return { overlapCount: 0, score: 0, sharedBrands: [], sharedStyles: [], sampleListingIds: [] };

  const overlapListings = await prisma.watchListing.findMany({
    where: { id: { in: overlapIds } },
    select: { brand: true, style: true },
  });

  return {
    overlapCount: overlapIds.length,
    score: Math.round((overlapIds.length / Math.max(myIds.size, 1)) * 100),
    sharedBrands: [...new Set(overlapListings.map(l => l.brand).filter(Boolean))] as string[],
    sharedStyles: [...new Set(overlapListings.map(l => l.style).filter(Boolean))] as string[],
    sampleListingIds: overlapIds.slice(0, 6),
  };
}
