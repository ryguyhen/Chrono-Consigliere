// src/lib/constants.ts
// Shared display label maps for watch enum values.
// Single source of truth — used in components, pages, and filter UI.

export const CONDITION_LABELS: Record<string, string> = {
  UNWORN: 'Unworn',
  MINT: 'Mint',
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
};

// Abbreviated labels for tight spaces (e.g. cards, badges)
export const CONDITION_LABELS_SHORT: Record<string, string> = {
  UNWORN: 'Unworn',
  MINT: 'Mint',
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'V. Good',
  GOOD: 'Good',
  FAIR: 'Fair',
};

export const MOVEMENT_LABELS: Record<string, string> = {
  AUTOMATIC: 'Automatic',
  MANUAL: 'Manual Wind',
  QUARTZ: 'Quartz',
  SPRINGDRIVE: 'Spring Drive',
};

export const STYLE_LABELS: Record<string, string> = {
  DRESS: 'Dress',
  SPORT: 'Sport',
  DIVE: 'Dive',
  CHRONOGRAPH: 'Chronograph',
  FIELD: 'Field',
  GMT: 'GMT',
  PILOT: 'Pilot',
  INTEGRATED_BRACELET: 'Integrated Bracelet',
  VINTAGE: 'Vintage',
  TONNEAU: 'Tonneau',
  SKELETON: 'Skeleton',
};
