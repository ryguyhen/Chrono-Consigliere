// src/app/friends/page.tsx
// Social hub: activity feed (Feed tab) + people discovery (People tab).
// Tab state is URL-driven (?tab=people). On mobile, the bottom nav labels
// this surface "Friends" so the in-page h1 is suppressed — the tabs serve
// as the primary navigation chrome.
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { getFeedForUser, getTasteOverlap } from '@/lib/social/feed-service';
import { formatPrice, timeAgo } from '@/lib/format';
import Link from 'next/link';
import Image from 'next/image';
import PeopleSearch from './PeopleSearch';

interface PageProps {
  searchParams: { tab?: string };
}

// User-facing copy for feed event types.
// Terse and natural — not internal system language.
const EVENT_VERB: Record<string, string> = {
  LIKED: 'liked',
  SAVED: 'saved',
  OWNED: 'owns',
  PURCHASED: 'bought',
  INFLUENCED_PURCHASE: 'bought after you saved it',
  FOLLOWED: 'is now following someone',
  ADDED_TO_COLLECTION: 'added to their roll',
};

function Avatar({ name, size = 34 }: { name: string | null; size?: number }) {
  const initials = (name ?? 'U').slice(0, 2).toUpperCase();
  const hue = (initials.charCodeAt(0) * 37 + (initials.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-medium text-white/70"
      style={{ width: size, height: size, fontSize: size * 0.32, background: `hsl(${hue}, 18%, 22%)` }}
    >
      {initials}
    </div>
  );
}

export default async function FriendsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const activeTab = searchParams.tab === 'people' ? 'people' : 'feed';

  // Always fetch: following + suggested users are needed on both tabs.
  // Skip feed events on the People tab — saves the feed query + follow lookup.
  const [feedResult, following, suggestedUsers] = await Promise.all([
    activeTab === 'feed'
      ? getFeedForUser(userId, undefined, 30)
      : Promise.resolve({ events: [], nextCursor: null }),
    prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { include: { profile: true } },
      },
      take: 20,
    }),
    prisma.user.findMany({
      where: {
        id: { not: userId },
        followers: { none: { followerId: userId } },
        profile: { isNot: null },
      },
      include: { profile: true },
      take: 6,
    }),
  ]);

  const feedEvents = feedResult.events;

  // Taste overlaps + trending are desktop-sidebar-only for the Feed tab.
  // Skip on People tab (~12 DB queries saved per load on mobile).
  const [trendingBrands, overlaps] = activeTab === 'feed' && following.length > 0
    ? await Promise.all([
        prisma.watchListing.groupBy({
          by: ['brand'],
          where: {
            isAvailable: true,
            likes: { some: { userId: { in: following.map((f: any) => f.followingId) } } },
          },
          _count: { brand: true },
          orderBy: { _count: { brand: 'desc' } },
          take: 6,
        }),
        Promise.all(
          following.slice(0, 3).map(async (f: any) => ({
            friend: f.following,
            overlap: await getTasteOverlap(userId, f.followingId),
          }))
        ),
      ])
    : [[], []];

  const initialSuggested = suggestedUsers.map((u: any) => ({
    id: u.id,
    username: u.profile?.username ?? u.id,
    displayName: u.profile?.displayName ?? u.name ?? null,
    tasteTags: u.profile?.tasteTags ?? [],
    isFollowing: false,
    followerCount: 0,
  }));

  return (
    <div>
      {/* Combined header + tab bar.
          The h1 "Friends" is suppressed on mobile — the bottom nav already labels
          this surface. On desktop it appears above the tabs as expected for a
          web layout. This saves one full row of chrome on phone. */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <h1 className="hidden md:block text-[1.4rem] font-semibold tracking-[-0.03em] pt-5 pb-3">
            Friends
          </h1>
          <div className="flex">
            <Link
              href="/friends"
              className={`px-4 py-3.5 text-[11px] font-mono tracking-[0.1em] uppercase border-b-2 transition-colors
                ${activeTab === 'feed' ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-ink'}`}
            >
              Feed
            </Link>
            <Link
              href="/friends?tab=people"
              className={`px-4 py-3.5 text-[11px] font-mono tracking-[0.1em] uppercase border-b-2 transition-colors
                ${activeTab === 'people' ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-ink'}`}
            >
              People
            </Link>
          </div>
        </div>
      </div>

      {activeTab === 'people' ? (
        // ── People tab ──────────────────────────────────────────────────────
        // Full-width on all screen sizes. The search box is the hero element.
        // Following list below provides a way to navigate to existing connections.
        <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PeopleSearch initialSuggested={initialSuggested} />

          {following.length > 0 && (
            <div className="mt-8">
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-4">
                Following · {following.length}
              </div>
              <div className="divide-y divide-[var(--border)]">
                {following.map((f: any) => (
                  <Link
                    key={f.followingId}
                    href={`/profile/${f.following.profile?.username}`}
                    className="flex items-center gap-3 py-3.5 group"
                  >
                    <Avatar name={f.following.profile?.displayName ?? f.following.name} size={34} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink group-hover:text-gold transition-colors truncate">
                        {f.following.profile?.displayName ?? f.following.name ?? 'Unknown'}
                      </div>
                      {f.following.profile?.username && (
                        <div className="text-[10px] text-muted">@{f.following.profile.username}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ── Feed tab ─────────────────────────────────────────────────────────
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-12">

            {/* Main: activity feed */}
            <div>
              {feedEvents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-3xl mb-5 opacity-15">◈</div>
                  <div className="text-[1.05rem] font-semibold mb-2">Nothing here yet</div>
                  <p className="text-[13px] text-muted mb-5 leading-relaxed">
                    Follow collectors to see what they're saving.
                  </p>
                  <Link
                    href="/friends?tab=people"
                    className="inline-block font-mono text-[10px] tracking-[0.12em] uppercase px-5 py-2.5 bg-gold text-black rounded font-bold hover:bg-gold-dark transition-colors"
                  >
                    Find people
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {feedEvents.map((event: any) => {
                    const isInfluence = event.type === 'INFLUENCED_PURCHASE';
                    const actorName = event.actor.profile?.displayName ?? event.actor.name ?? 'Someone';
                    const actorUsername = event.actor.profile?.username;
                    const verb = EVENT_VERB[event.type] ?? event.type.toLowerCase();

                    return (
                      <div
                        key={event.id}
                        className={`py-5 flex gap-4 ${isInfluence ? 'bg-gold/[0.025] -mx-4 px-4 rounded' : ''}`}
                      >
                        <Link href={`/profile/${actorUsername}`} className="flex-shrink-0 mt-0.5">
                          <Avatar name={actorName} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          {isInfluence && (
                            <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-gold/70 mb-1.5">
                              In your roll
                            </div>
                          )}
                          <div className="text-[13px] text-ink/70 mb-3 leading-snug">
                            <Link
                              href={`/profile/${actorUsername}`}
                              className="text-ink font-medium hover:text-gold transition-colors"
                            >
                              {actorName}
                            </Link>
                            {' '}{verb}
                          </div>
                          {event.listing && (
                            <Link href={`/watch/${event.listing.id}`} className="flex gap-3 group">
                              <div className="w-[52px] h-[52px] rounded flex-shrink-0 bg-[#1A1A1A] overflow-hidden relative border border-[var(--border)]">
                                {event.listing.images?.[0] ? (
                                  <Image
                                    src={event.listing.images[0].url}
                                    alt={event.listing.sourceTitle}
                                    fill sizes="52px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full border border-white/10" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex flex-col justify-center">
                                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-gold/75 mb-0.5">
                                  {event.listing.brand}
                                </div>
                                <div className="text-[14px] font-medium text-ink truncate group-hover:text-gold transition-colors">
                                  {event.listing.model || event.listing.sourceTitle}
                                </div>
                                <div className="text-[11px] text-muted mt-0.5">
                                  {formatPrice(event.listing.price, event.listing.currency)}
                                </div>
                              </div>
                            </Link>
                          )}
                          <div className="font-mono text-[9px] text-muted/50 mt-2.5">
                            {timeAgo(new Date(event.createdAt))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop sidebar — informational only.
                PeopleSearch lives in the People tab; no duplication here.
                Sidebar contains passive intel: shared taste + circle trends + following. */}
            <div className="hidden lg:block space-y-8">

              {(overlaps as any[]).some((o: any) => (o.overlap.overlapCount ?? 0) > 0) && (
                <div>
                  <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-4">
                    Shared taste
                  </div>
                  <div className="space-y-4">
                    {(overlaps as any[])
                      .filter((o: any) => (o.overlap.overlapCount ?? 0) > 0)
                      .map(({ friend, overlap }: any) => (
                        <Link
                          key={friend.id}
                          href={`/profile/${friend.profile?.username}`}
                          className="flex items-center gap-3 group"
                        >
                          <Avatar name={friend.profile?.displayName ?? friend.name} size={26} />
                          <div className="flex-1 min-w-0 text-[12px] text-ink/70 leading-snug">
                            <span className="font-medium text-ink group-hover:text-gold transition-colors">
                              {friend.profile?.displayName ?? friend.name}
                            </span>
                            {overlap.sharedBrands.length > 0 && (
                              <span className="text-muted">
                                {' '}— {overlap.sharedBrands.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-gold flex-shrink-0">
                            {overlap.score}%
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {(trendingBrands as any[]).length > 0 && (
                <div>
                  <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-4">
                    Your circle's into
                  </div>
                  <div className="space-y-1.5">
                    {(trendingBrands as any[]).map((b: any, i: number) => (
                      <Link
                        key={b.brand}
                        href={`/browse?brand=${encodeURIComponent(b.brand)}`}
                        className="flex items-center gap-3 py-1 group"
                      >
                        <span className="font-mono text-[9px] text-muted/40 w-4 text-right flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-[13px] text-ink group-hover:text-gold transition-colors truncate">
                          {b.brand}
                        </span>
                        <span className="text-[10px] text-muted/50 flex-shrink-0">
                          {b._count.brand}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {following.length > 0 && (
                <div>
                  <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-4">
                    Following · {following.length}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {following.map((f: any) => (
                      <Link
                        key={f.followingId}
                        href={`/profile/${f.following.profile?.username}`}
                        title={f.following.profile?.displayName ?? f.following.name ?? ''}
                      >
                        <Avatar name={f.following.profile?.displayName ?? f.following.name} size={28} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
