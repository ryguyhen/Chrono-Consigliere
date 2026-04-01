// src/app/api/follow/[userId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { emitFeedEvent } from '@/lib/social/feed-service';

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const followerId = session.user.id;
  const followingId = params.userId;

  if (followerId === followingId)
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  try {
    await prisma.follow.create({ data: { followerId, followingId } });
    await emitFeedEvent({ actorId: followerId, type: 'FOLLOWED', metadata: { followingId } });
    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ following: false }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const followerId = session.user.id;

  await prisma.follow.deleteMany({ where: { followerId, followingId: params.userId } });
  return NextResponse.json({ following: false });
}
