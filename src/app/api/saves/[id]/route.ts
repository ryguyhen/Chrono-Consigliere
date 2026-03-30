// src/app/api/saves/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { emitFeedEvent } from '@/lib/social/feed-service';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const listingId = params.id;

  let collectionId: string | undefined;
  try {
    const body = await req.json();
    collectionId = body.collectionId;
  } catch { /* no body is fine */ }

  try {
    await prisma.wishlistItem.create({ data: { userId, listingId, collectionId } });
    await prisma.watchListing.update({
      where: { id: listingId },
      data: { saveCount: { increment: 1 } },
    });
    await emitFeedEvent({ actorId: userId, type: 'SAVED', listingId });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ saved: false }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const listingId = params.id;

  await prisma.wishlistItem.deleteMany({ where: { userId, listingId } });
  await prisma.watchListing.update({
    where: { id: listingId },
    data: { saveCount: { decrement: 1 } },
  });
  return NextResponse.json({ saved: false });
}
