// prisma/seed.ts
// Seed the database with demo data so the app feels alive before real scraping.
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEALERS = [
  {
    name: 'Crown & Caliber',
    slug: 'crown-caliber',
    baseUrl: 'https://www.crownandcaliber.com',
    adapterName: 'CrownCaliberAdapter',
    scrapeConfig: {},
  },
  {
    name: 'WatchBox',
    slug: 'watchbox',
    baseUrl: 'https://www.thewatchbox.com',
    adapterName: 'WatchBoxAdapter',
    scrapeConfig: {},
  },
  {
    name: 'Govberg Jewelers',
    slug: 'govberg',
    baseUrl: 'https://www.govberg.com',
    adapterName: 'GovbergAdapter',
    scrapeConfig: {},
  },
  {
    name: "Bob's Watches",
    slug: 'bobs-watches',
    baseUrl: 'https://www.bobswatches.com',
    adapterName: 'BobsWatchesAdapter',
    scrapeConfig: {},
  },
];

const WATCH_SEED_DATA = [
  {
    brand: 'Rolex',
    model: 'Explorer II',
    reference: '16570',
    year: 1999,
    caseSizeMm: 40,
    caseMaterial: 'Stainless Steel',
    dialColor: 'Polar White',
    movementType: 'AUTOMATIC' as const,
    condition: 'EXCELLENT' as const,
    style: 'SPORT' as const,
    price: 850000,
    sourceTitle: 'Rolex Explorer II Ref. 16570 Polar Dial Full Set',
    sourcePrice: '$8,500',
    description: 'Polar dial variant, full set with original box and papers. Recently serviced by Rolex Service Center. Minimal wear consistent with careful use.',
    dealerSlug: 'crown-caliber',
    sourceUrl: 'https://www.crownandcaliber.com/products/rolex-explorer-ii-16570-polar-demo',
  },
  {
    brand: 'A. Lange & Söhne',
    model: 'Lange 1',
    reference: '101.039',
    year: 2004,
    caseSizeMm: 38.5,
    caseMaterial: 'Yellow Gold',
    dialColor: 'Champagne',
    movementType: 'MANUAL' as const,
    condition: 'VERY_GOOD' as const,
    style: 'DRESS' as const,
    price: 2450000,
    sourceTitle: 'A. Lange & Söhne Lange 1 101.039 Yellow Gold Complete Set',
    sourcePrice: '$24,500',
    description: 'Iconic first-series Lange 1 in 18k yellow gold. Champagne dial with beautiful guilloche. Original leather strap, complete set.',
    dealerSlug: 'watchbox',
    sourceUrl: 'https://www.thewatchbox.com/pre-owned/lange-1-101-039-demo',
  },
  {
    brand: 'Patek Philippe',
    model: 'Calatrava',
    reference: '5196P-001',
    year: 2018,
    caseSizeMm: 36,
    caseMaterial: 'Platinum',
    dialColor: 'Silver Opaline',
    movementType: 'MANUAL' as const,
    condition: 'MINT' as const,
    style: 'DRESS' as const,
    price: 3800000,
    sourceTitle: 'Patek Philippe Calatrava 5196P-001 Platinum Full Set Unworn',
    sourcePrice: '$38,000',
    description: 'Ultra-thin manual wind Calatrava in 950 platinum. Silver opaline dial with applied gold baton indices. Effectively unworn with complete set.',
    dealerSlug: 'govberg',
    sourceUrl: 'https://www.govberg.com/products/patek-calatrava-5196p-demo',
  },
  {
    brand: 'Heuer',
    model: 'Autavia',
    reference: '11630',
    year: 1973,
    caseSizeMm: 40,
    caseMaterial: 'Stainless Steel',
    dialColor: 'Black (Siffert)',
    movementType: 'AUTOMATIC' as const,
    condition: 'GOOD' as const,
    style: 'CHRONOGRAPH' as const,
    price: 720000,
    sourceTitle: 'Heuer Autavia Ref. 11630 Siffert Dial 1973 All Original',
    sourcePrice: '$7,200',
    description: 'Rare Siffert-face Autavia with stunning dial patina. All original parts including pushers and crown. Running beautifully, recently serviced.',
    dealerSlug: 'bobs-watches',
    sourceUrl: 'https://www.bobswatches.com/heuer-autavia-11630-demo',
  },
  {
    brand: 'Omega',
    model: 'Seamaster 300M',
    reference: '2531.80',
    year: 2001,
    caseSizeMm: 41,
    caseMaterial: 'Stainless Steel',
    dialColor: 'Blue Wave',
    movementType: 'AUTOMATIC' as const,
    condition: 'VERY_GOOD' as const,
    style: 'DIVE' as const,
    price: 340000,
    sourceTitle: 'Omega Seamaster 300M 2531.80 Blue Dial Box & Papers',
    sourcePrice: '$3,400',
    description: 'Classic pre-Planet Ocean Seamaster in excellent condition. Blue wave dial. Full set with box and papers. Serviced within 18 months.',
    dealerSlug: 'crown-caliber',
    sourceUrl: 'https://www.crownandcaliber.com/products/omega-seamaster-2531-demo',
  },
  {
    brand: 'Audemars Piguet',
    model: 'Royal Oak',
    reference: '15300ST',
    year: 2012,
    caseSizeMm: 39,
    caseMaterial: 'Stainless Steel',
    dialColor: 'Blue Tapisserie',
    movementType: 'AUTOMATIC' as const,
    condition: 'VERY_GOOD' as const,
    style: 'INTEGRATED_BRACELET' as const,
    price: 2850000,
    sourceTitle: 'Audemars Piguet Royal Oak 15300ST Blue Tapisserie Full Set',
    sourcePrice: '$28,500',
    description: 'Blue tapisserie dial in near-perfect condition. Full set with original box, papers, and AP service papers. Light wear on bracelet only.',
    dealerSlug: 'watchbox',
    sourceUrl: 'https://www.thewatchbox.com/pre-owned/royal-oak-15300st-demo',
  },
  {
    brand: 'Vacheron Constantin',
    model: 'Patrimony',
    reference: '81180',
    year: 2015,
    caseSizeMm: 38,
    caseMaterial: 'White Gold',
    dialColor: 'Silver Opaline',
    movementType: 'AUTOMATIC' as const,
    condition: 'MINT' as const,
    style: 'DRESS' as const,
    price: 1680000,
    sourceTitle: 'Vacheron Constantin Patrimony 81180 White Gold Mint',
    sourcePrice: '$16,800',
    description: 'The understated pinnacle of the dress watch genre. In-house Calibre 2450 Q6G. Silver opaline dial, leaf hands. Effectively unworn.',
    dealerSlug: 'govberg',
    sourceUrl: 'https://www.govberg.com/products/vc-patrimony-81180-demo',
  },
  {
    brand: 'IWC',
    model: 'Mark XV',
    reference: 'IW3253',
    year: 1999,
    caseSizeMm: 38,
    caseMaterial: 'Stainless Steel',
    dialColor: 'Silver',
    movementType: 'AUTOMATIC' as const,
    condition: 'EXCELLENT' as const,
    style: 'FIELD' as const,
    price: 410000,
    sourceTitle: "IWC Pilot's Mark XV IW3253 Silver Dial Full Set",
    sourcePrice: '$4,100',
    description: "Clean silver dial with excellent proportions. The pinnacle of the pilot's field watch form. Recently serviced with papers.",
    dealerSlug: 'crown-caliber',
    sourceUrl: 'https://www.crownandcaliber.com/products/iwc-mark-xv-3253-demo',
  },
];

const USERS = [
  {
    email: 'ryan@example.com',
    name: 'Ryan Sandoval',
    username: 'ryansandoval',
    bio: 'Vintage Rolex, modern Patek. Sucker for sub-36mm dress watches. NYC-based. The wrist is the edit.',
    tasteTags: ['Dress Watch', 'Sub-36mm', 'Manual Wind', 'Vintage'],
    topBrands: ['Patek Philippe', 'Rolex', 'Vacheron Constantin'],
  },
  {
    email: 'james@example.com',
    name: 'James Torres',
    username: 'jamest',
    bio: 'Collector. Vintage sport and modern dress. Chicago.',
    tasteTags: ['Sport Watch', 'Chronograph', 'Vintage'],
    topBrands: ['Rolex', 'Heuer', 'Patek Philippe'],
  },
  {
    email: 'marcus@example.com',
    name: 'Marcus Reyes',
    username: 'marcusr',
    bio: 'German engineering enthusiast. A. Lange, Glashütte, Nomos.',
    tasteTags: ['German Watches', 'Manual Wind', 'Dress Watch'],
    topBrands: ['A. Lange & Söhne', 'Glashütte Original', 'Nomos'],
  },
  {
    email: 'priya@example.com',
    name: 'Priya Kapoor',
    username: 'priyak',
    bio: 'Integrated bracelet obsessive. AP, JLC, Rolex Sport.',
    tasteTags: ['Integrated Bracelet', 'Sport', 'Modern'],
    topBrands: ['Audemars Piguet', 'Jaeger-LeCoultre', 'Rolex'],
  },
];

async function main() {
  console.log('🌱 Seeding Chrono Consigliere...');

  // Clear existing seed data
  await prisma.activityFeedEvent.deleteMany();
  await prisma.like.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.watchImage.deleteMany();
  await prisma.watchListing.deleteMany();
  await prisma.dealerSource.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create dealers
  console.log('Creating dealer sources...');
  const dealers = await Promise.all(
    DEALERS.map(d => prisma.dealerSource.create({ data: d }))
  );
  const dealerBySlug = Object.fromEntries(dealers.map(d => [d.slug, d]));

  // Create listings
  console.log('Creating watch listings...');
  const listings = await Promise.all(
    WATCH_SEED_DATA.map(w => {
      const { dealerSlug, ...data } = w;
      return prisma.watchListing.create({
        data: {
          ...data,
          sourceId: dealerBySlug[dealerSlug].id,
          isAvailable: true,
          lastCheckedAt: new Date(),
        },
      });
    })
  );

  // Create users + profiles
  console.log('Creating users...');
  const users = await Promise.all(
    USERS.map(async u => {
      const { username, bio, tasteTags, topBrands, ...userData } = u;
      const user = await prisma.user.create({ data: userData });
      await prisma.profile.create({
        data: {
          userId: user.id,
          username,
          bio,
          tasteTags,
          topBrands,
        },
      });
      return user;
    })
  );

  const [ryan, james, marcus, priya] = users;

  // Follow relationships
  console.log('Creating social graph...');
  await prisma.follow.createMany({
    data: [
      { followerId: ryan.id, followingId: james.id },
      { followerId: ryan.id, followingId: marcus.id },
      { followerId: ryan.id, followingId: priya.id },
      { followerId: james.id, followingId: ryan.id },
      { followerId: marcus.id, followingId: ryan.id },
      { followerId: priya.id, followingId: ryan.id },
    ],
  });

  // Likes
  await prisma.like.createMany({
    data: [
      // Ryan likes
      { userId: ryan.id, listingId: listings[0].id }, // Rolex Explorer
      { userId: ryan.id, listingId: listings[2].id }, // Patek Calatrava
      { userId: ryan.id, listingId: listings[6].id }, // VC Patrimony
      // James likes
      { userId: james.id, listingId: listings[0].id }, // also Rolex Explorer
      { userId: james.id, listingId: listings[3].id }, // Heuer Autavia
      { userId: james.id, listingId: listings[5].id }, // AP Royal Oak
      // Marcus likes
      { userId: marcus.id, listingId: listings[1].id }, // Lange 1
      { userId: marcus.id, listingId: listings[4].id }, // Omega Seamaster
      // Priya likes
      { userId: priya.id, listingId: listings[2].id }, // Patek (overlap with Ryan)
      { userId: priya.id, listingId: listings[5].id }, // AP Royal Oak
    ],
  });

  // Update like counts on listings
  for (const listing of listings) {
    const count = await prisma.like.count({ where: { listingId: listing.id } });
    await prisma.watchListing.update({
      where: { id: listing.id },
      data: { likeCount: count },
    });
  }

  // Saves
  await prisma.wishlistItem.createMany({
    data: [
      { userId: ryan.id, listingId: listings[2].id }, // saved Patek
      { userId: ryan.id, listingId: listings[6].id }, // saved VC
      { userId: james.id, listingId: listings[1].id }, // James saved Lange 1
    ],
  });

  // Purchase events + influence events
  await prisma.purchaseEvent.create({
    data: {
      userId: marcus.id,
      listingId: listings[1].id, // Marcus bought the Lange 1
      purchasedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      notes: 'Finally got my grail.',
      isPublic: true,
    },
  });

  // Feed events
  await prisma.activityFeedEvent.createMany({
    data: [
      // James liked Explorer II
      {
        actorId: james.id,
        type: 'LIKED',
        listingId: listings[0].id,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      // Priya saved Patek
      {
        actorId: priya.id,
        type: 'SAVED',
        listingId: listings[2].id,
        metadata: { collectionName: 'Grails' },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      // Marcus bought Lange 1 — influence event (James had it saved)
      {
        actorId: marcus.id,
        type: 'PURCHASED',
        listingId: listings[1].id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        actorId: marcus.id,
        targetUserId: james.id,
        type: 'INFLUENCED_PURCHASE',
        listingId: listings[1].id,
        metadata: { influencedBy: james.id },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`  ${dealers.length} dealer sources`);
  console.log(`  ${listings.length} watch listings`);
  console.log(`  ${users.length} users`);
  console.log('\nDemo credentials:');
  console.log('  ryan@example.com / password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
