// src/app/api/purchases/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { emitFeedEvent } from '@/lib/social/feed-service';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const { listingId, priceActual, notes } = await req.json();
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  const purchase = await prisma.purchaseEvent.create({
    data: { userId, listingId, priceActual, notes, isPublic: true },
  });

  // Emit social events (including influence detection)
  await emitFeedEvent({ actorId: userId, type: 'PURCHASED', listingId });

  return NextResponse.json({ success: true, purchaseId: purchase.id });
}
