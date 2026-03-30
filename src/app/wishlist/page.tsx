// src/app/wishlist/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';
import { WatchCard } from '@/components/watches/WatchCard';
import Link from 'next/link';

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: { collection?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;

  const [collections, totalSaves] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.wishlistItem.count({ where: { userId } }),
  ]);

  const activeCollectionId = searchParams.collection;

  // Fetch saves — filtered by collection if selected
  const saves = await prisma.wishlistItem.findMany({
    where: {
      userId,
      ...(activeCollectionId ? { collectionId: activeCollectionId } : {}),
    },
    include: {
      listing: {
        include: {
          source: { select: { id: true, name: true, slug: true, baseUrl: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  return (
    <div>
      {/* Header */}
      <div className="bg-ink text-cream px-6 py-8">
        <div className="text-[10px] uppercase tracking-[0.14em] text-gold mb-2">My Wishlist</div>
        <h1 className="font-serif text-[1.8rem] font-light mb-1">
          {activeCollection ? activeCollection.name : 'All saved watches'}
        </h1>
        <div className="text-[12px] text-cream/40">
          {activeCollection
            ? `${activeCollection._count.items} watches · part of your wishlist`
            : `${totalSaves} watches · last updated recently`}
        </div>
      </div>

      {/* Collection tabs */}
      <div className="bg-surface border-b border-[var(--border)] px-5 py-3 flex gap-2 overflow-x-auto">
        <Link
          href="/wishlist"
          className={`px-3.5 py-1.5 rounded-full text-[11px] border whitespace-nowrap transition-colors
            ${!activeCollectionId
              ? 'bg-ink text-cream border-ink'
              : 'border-[var(--border)] text-ink/70 hover:border-gold hover:text-gold'}`}
        >
          All ({totalSaves})
        </Link>
        {collections.map(col => (
          <Link
            key={col.id}
            href={`/wishlist?collection=${col.id}`}
            className={`px-3.5 py-1.5 rounded-full text-[11px] border whitespace-nowrap transition-colors
              ${activeCollectionId === col.id
                ? 'bg-ink text-cream border-ink'
                : 'border-[var(--border)] text-ink/70 hover:border-gold hover:text-gold'}`}
          >
            {col.name} ({col._count.items})
          </Link>
        ))}
        <button className="px-3.5 py-1.5 rounded-full text-[11px] border border-dashed border-[var(--border)] text-muted hover:border-gold hover:text-gold transition-colors whitespace-nowrap">
          + New list
        </button>
      </div>

      {/* Grid */}
      <div className="px-5 py-5">
        {saves.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {saves.map(s => (
              <WatchCard
                key={s.id}
                watch={{ ...s.listing, isLiked: false, isSaved: true, friendLikes: [] } as any}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <div className="font-serif text-4xl mb-4 opacity-20">⊕</div>
            <div className="font-serif text-xl font-light mb-2">
              {activeCollection ? `${activeCollection.name} is empty` : 'Your wishlist is empty'}
            </div>
            <p className="text-sm mb-5">Save watches from the browse page to build your wishlist.</p>
            <Link href="/browse" className="text-[12px] uppercase tracking-wide text-gold hover:text-gold-dark">
              Browse watches →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
