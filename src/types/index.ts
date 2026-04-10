// src/types/index.ts
// Shared types used across the app

export type WatchWithRelations = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  year: number | null;
  caseSizeMm: number | null;
  caseMaterial: string | null;
  dialColor: string | null;
  movementType: string | null;
  condition: string | null;
  style: string | null;
  price: number | null; // cents
  currency: string;
  description: string | null;
  sourceTitle: string;
  sourcePrice: string | null;
  sourceUrl: string;
  isAvailable: boolean;
  likeCount: number;
  saveCount: number;
  createdAt: Date;
  updatedAt: Date;
  source: {
    id: string;
    name: string;
    slug: string;
    baseUrl: string;
  };
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
  }[];
  /**
   * User interaction state. `null` = viewer is unauthenticated (state unknown).
   * `false` = authenticated but not liked/saved/owned.
   * Populated by queries when a userId is provided; null otherwise.
   */
  isLiked: boolean | null;
  isSaved: boolean | null;
  /**
   * `true` when the viewer has a WishlistItem with list=OWNED for this listing.
   * Distinct from a PurchaseEvent (which records a specific transaction with price/date).
   * null when unauthenticated.
   */
  isOwned: boolean | null;
  /**
   * Friends who have liked or saved this listing.
   * NOTE: populated only on the watch detail page via an explicit join — never
   * populated by getWatches() or getWatchById() without extra work.
   * Always [] in browse/roll/profile contexts.
   */
  friendLikes?: { userId: string; user: { profile: { username: string; displayName: string | null } | null } }[];
};

export type UserProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  tasteTags: string[];
  topBrands: string[];
  wishlistPrivacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  activityPrivacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  user: {
    id: string;
    name: string | null;
    image: string | null;
    _count: {
      following: number;
      followers: number;
      likes: number;
      saves: number;
    };
  };
  isFollowing?: boolean;
};

export type FeedEvent = {
  id: string;
  type: 'LIKED' | 'SAVED' | 'OWNED' | 'PURCHASED' | 'INFLUENCED_PURCHASE' | 'FOLLOWED' | 'ADDED_TO_COLLECTION';
  createdAt: Date;
  metadata: Record<string, unknown> | null;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
    profile: { username: string; displayName: string | null; avatarUrl: string | null } | null;
  };
  listing: WatchWithRelations | null;
};

export type BrowseFilters = {
  q?: string;
  brand?: string[];
  style?: string[];
  movement?: string[];
  condition?: string[];
  dealer?: string[];
  minPrice?: number;
  maxPrice?: number;
  minCase?: number;
  maxCase?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'most-liked';
  page?: number;
};

export type PaginatedWatches = {
  watches: WatchWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type TasteOverlap = {
  overlapCount: number;
  score: number;
  sharedBrands: string[];
  sharedStyles: string[];
  sampleListingIds: string[];
};
