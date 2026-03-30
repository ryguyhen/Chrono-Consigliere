# Chrono Consigliere

> A social watch discovery engine for people with taste.

Chrono Consigliere aggregates in-stock watch listings from curated dealer sites and layers a social taste graph on top — likes, saves, collections, activity feeds, and influence tracking.

**Disclaimer**: Chrono Consigliere is a discovery and curation tool. All watches link to their original dealer websites for purchase. Chrono Consigliere does not sell watches.

---

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or Supabase/Railway/Neon)
- Redis (for job queue — local or Upstash)
- `pnpm` or `npm`

### 2. Clone and install

```bash
git clone <your-repo>
cd chrono-consigliere
npm install
npx playwright install chromium
```

### 3. Environment variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chrono_consigliere"

# Auth — generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional for MVP — email/password works without)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Redis (for scrape job queue)
REDIS_URL="redis://localhost:6379"

# Optional: Upstash Redis for serverless
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 4. Database setup

```bash
# Push schema to database
npm run db:push

# Or use migrations (preferred for production)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 5. Run dev server

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Run the scraper (optional for local dev)

The seed data gives you demo listings. To run real scraping:

```bash
# Run all active scrapers
npm run scrape:all

# Run a specific source
npm run scrape:run -- --source crown-caliber
```

### 7. Start the job worker (for scheduled scraping)

```bash
npm run worker
```

---

## Adding a new dealer source

1. Create `src/lib/scraper/adapters/your-dealer.adapter.ts`
2. Extend `BaseAdapter` and implement `scrape()`
3. Register it in `src/lib/scraper/adapter-registry.ts`
4. Add a `DealerSource` row in the database (or via Admin UI)

```typescript
// src/lib/scraper/adapters/my-dealer.adapter.ts
import { BaseAdapter, type ScrapeResult } from '../base-adapter';

export class MyDealerAdapter extends BaseAdapter {
  constructor() {
    super({
      sourceId: '',
      sourceName: 'My Dealer',
      baseUrl: 'https://www.mydealer.com',
      rateLimit: 2500,
    });
  }

  async scrape(): Promise<ScrapeResult> {
    // ... Playwright scraping logic
  }
}
```

---

## Project structure

```
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing / discover page
│   │   ├── browse/            # Browse + filter page
│   │   ├── watch/[id]/        # Watch detail page
│   │   ├── profile/[username] # User profile page
│   │   ├── feed/              # Friends activity feed
│   │   ├── wishlist/          # User wishlist + collections
│   │   ├── admin/             # Admin source management
│   │   └── api/               # Route handlers (auth, likes, etc.)
│   ├── components/
│   │   ├── watches/           # WatchCard, WatchGrid, WatchDetail
│   │   ├── social/            # FeedItem, TasteOverlap, FollowButton
│   │   ├── layout/            # Nav, Footer, PageShell
│   │   └── ui/                # Primitives (Button, Badge, etc.)
│   ├── lib/
│   │   ├── scraper/           # Scraper framework
│   │   │   ├── base-adapter.ts
│   │   │   ├── adapter-registry.ts
│   │   │   ├── scrape-runner.ts
│   │   │   └── adapters/      # One file per dealer
│   │   ├── social/
│   │   │   └── feed-service.ts
│   │   ├── db/                # Prisma client singleton
│   │   └── queue/             # BullMQ worker + job definitions
│   └── types/                 # Shared TypeScript types
└── scripts/                   # CLI scraper scripts
```

---

## MVP vs Roadmap

### MVP (build now)
- [x] Prisma schema + seed data
- [x] Browse + filter page with full filtering
- [x] Watch detail page with source link
- [x] Like / save actions
- [x] User auth (NextAuth)
- [x] Profile page with taste DNA
- [x] Activity feed
- [x] Influence events
- [x] Admin source management
- [x] Scraper framework with base adapter
- [x] Crown & Caliber adapter (template for others)

### Roadmap (after MVP)
- [ ] Full-text search with Postgres trigrams or Typesense
- [ ] Email notifications for influence events
- [ ] Mobile app (React Native)
- [ ] Watch image similarity deduplication (pHash)
- [ ] AI taste profile generation ("You gravitate toward...")
- [ ] Price history tracking
- [ ] Alert me when a saved watch drops in price
- [ ] Public profile embeds / shareable taste cards
- [ ] Verified dealer badges
- [ ] "Available near me" filtering (US state)
- [ ] Instagram / Twitter social sharing
- [ ] Apple Watch complication for latest notifications

---

## Legal notes

- Chrono Consigliere scrapes publicly available inventory pages. Always respect `robots.txt` and rate limits.
- Every watch listing links back to the original dealer website. Chrono Consigliere is not a reseller.
- Users purchase directly from dealers. Chrono Consigliere makes no warranties about listing accuracy or availability.
- Consider reaching out to dealers directly about partnership agreements as the platform scales.
