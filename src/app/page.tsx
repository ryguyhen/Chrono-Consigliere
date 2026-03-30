// src/app/page.tsx
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { getTrendingWatches, getNewArrivals } from '@/lib/watches/queries';
import { WatchCard } from '@/components/watches/WatchCard';
import { prisma } from '@/lib/db';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const [trending, newArrivals, stats] = await Promise.all([
    getTrendingWatches(userId, 6),
    getNewArrivals(4),
    prisma.watchListing.aggregate({
      where: { isAvailable: true },
      _count: { id: true },
    }),
  ]);

  const totalListings = stats._count.id;

  return (
    <div>
      {/* HERO */}
      <section className="bg-ink text-cream px-8 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/5 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold mb-6">
            Social Watch Discovery
          </div>
          <h1 className="font-serif text-[clamp(2.8rem,7vw,5rem)] font-light leading-[1.05] mb-6 text-cream">
            Your taste.<br />
            <em className="italic text-gold">Validated.</em>
          </h1>
          <p className="text-[15px] text-cream/60 max-w-[520px] mx-auto mb-10 leading-relaxed">
            Discover, curate, and share the watches you love. See what your friends are into.
            Know when your curation influences a purchase.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/browse" className="bg-gold text-ink text-[12px] font-medium tracking-[0.06em] uppercase px-5 py-3 rounded hover:bg-gold-dark transition-colors">
              Browse Inventory
            </Link>
            {!session && (
              <Link href="/login" className="border border-white/20 text-cream text-[12px] font-medium tracking-[0.06em] uppercase px-5 py-3 rounded hover:border-gold hover:text-gold transition-colors">
                Join the Community
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-14 pt-8 border-t border-white/10">
            {[
              [totalListings.toLocaleString(), 'In-Stock Watches'],
              ['20', 'Curated Dealers'],
              ['10', 'Countries'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-serif text-[2rem] font-light text-cream">{n}</div>
                <div className="text-[10px] tracking-[0.1em] uppercase text-cream/40 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVITY TICKER */}
      <div className="bg-parchment border-b border-[var(--border)] py-2.5 px-6 flex gap-8 overflow-x-auto text-[12px] text-muted">
        {[
          'James T. saved a Rolex Explorer II',
          'Marcus L. bought a Lange 1 — Ryan had it on his wishlist',
          'New listing: Patek Philippe 5712A from Goldfinger\'s Vintage',
          'Priya K. liked 4 watches this morning',
          'New arrival: Heuer Autavia from Craft & Tailored',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {/* TRENDING */}
      {trending.length > 0 && (
        <section className="px-6 py-10 max-w-[1200px] mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <div>
              <div className="text-[10px] tracking-[0.14em] uppercase text-muted mb-1">Most liked in your network</div>
              <h2 className="font-serif text-[1.5rem] font-light">Trending right now</h2>
            </div>
            <Link href="/browse?sort=most-liked" className="text-[11px] tracking-[0.06em] uppercase text-gold hover:text-gold-dark transition-colors">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {trending.map(watch => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="px-6 pb-10 max-w-[1200px] mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <div>
              <div className="text-[10px] tracking-[0.14em] uppercase text-muted mb-1">Just listed</div>
              <h2 className="font-serif text-[1.5rem] font-light">New arrivals</h2>
            </div>
            <Link href="/browse?sort=newest" className="text-[11px] tracking-[0.06em] uppercase text-gold hover:text-gold-dark transition-colors">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {newArrivals.map(watch => (
              <WatchCard key={watch.id} watch={watch} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURE CALLOUTS */}
      <section className="bg-ink text-cream py-14 px-6">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            ['⌚', 'Live inventory', 'In-stock watches from 20 curated dealers, refreshed daily. Never see a sold listing.'],
            ['♡', 'Taste graph', 'Your likes and saves build a living profile of your horological identity.'],
            ['◈', 'Influence events', 'When a friend buys something you discovered first, you get credit.'],
            ['⧖', 'Overlap finder', 'See exactly which brands, styles, and eras you and a friend share.'],
          ].map(([icon, title, desc]) => (
            <div key={title}>
              <div className="text-[1.8rem] mb-3">{icon}</div>
              <div className="font-serif text-[1.1rem] font-light mb-2">{title}</div>
              <div className="text-[13px] text-cream/50 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
