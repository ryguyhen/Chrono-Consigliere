// src/app/api/likes/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { emitFeedEvent } from '@/lib/social/feed-service';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const listingId = params.id;

  try {
    await prisma.like.create({ data: { userId, listingId } });
    await prisma.watchListing.update({
      where: { id: listingId },
      data: { likeCount: { increment: 1 } },
    });
    await emitFeedEvent({ actorId: userId, type: 'LIKED', listingId });
    return NextResponse.json({ liked: true });
  } catch {
    return NextResponse.json({ liked: false }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const listingId = params.id;

  const deleted = await prisma.like.deleteMany({ where: { userId, listingId } });
  if (deleted.count > 0) {
    // Guard: only decrement if count is already positive to prevent going negative
    await prisma.watchListing.updateMany({
      where: { id: listingId, likeCount: { gt: 0 } },
      data: { likeCount: { decrement: 1 } },
    });
  }
  return NextResponse.json({ liked: false });
}
