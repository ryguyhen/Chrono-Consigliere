// src/app/api/feed/route.ts
//
// GET /api/feed — cursor-paginated activity feed for the authenticated user.
// Designed for consumption by a native mobile client.
//
// Query params:
//   cursor  — opaque cursor returned by a previous response (event ID)
//   limit   — number of events to return (default 20, max 50)
//
// Response:
//   { events, nextCursor }
//
// nextCursor is null when there are no more events.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { getFeedForUser } from '@/lib/social/feed-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const cursor = sp.get('cursor') ?? undefined;
    const limitParam = parseInt(sp.get('limit') ?? '20', 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 20 : limitParam), 50);

    const { events, nextCursor } = await getFeedForUser(session.user.id, cursor, limit);

    return NextResponse.json({ events, nextCursor });
  } catch (err: any) {
    console.error('[GET /api/feed]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
