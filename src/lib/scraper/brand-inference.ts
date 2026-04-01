// src/lib/scraper/brand-inference.ts
// Single source of truth for watch brand detection across all scraper adapters.
//
// inferBrand(title, description?) returns:
//   { brand: string; matched: string } | null
//
//   brand   — canonical name to store in the DB
//   matched — the text that was actually found in the source string, used by
//             adapters to strip the brand from the title when extracting model
//             (e.g. alias "JLC" → brand "Jaeger-LeCoultre", matched "JLC")

export interface BrandMatch {
  brand: string;   // canonical name to persist
  matched: string; // actual text found in the title (for model extraction)
}

// ---------------------------------------------------------------------------
// Alias map — maps lowercase alias text → canonical brand name.
// Entries with key length ≤ SHORT_ALIAS_MAX are matched with \b word boundaries
// to reduce false positives ("AP" must be a standalone token, not part of "CAPTAIN").
// Entries with longer keys use simple case-insensitive substring matching.
// ---------------------------------------------------------------------------
const SHORT_ALIAS_MAX = 4;

const ALIASES: Record<string, string> = {
  // Jaeger-LeCoultre
  'jlc': 'Jaeger-LeCoultre',
  'lecoultre': 'Jaeger-LeCoultre',
  'le coultre': 'Jaeger-LeCoultre',
  'jaeger lecoultre': 'Jaeger-LeCoultre',
  // Audemars Piguet
  'ap': 'Audemars Piguet',
  // Girard-Perregaux
  'gp': 'Girard-Perregaux',
  // A. Lange & Söhne
  'als': 'A. Lange & Söhne',
  'a. lange': 'A. Lange & Söhne',
  'a lange': 'A. Lange & Söhne',
  'a. lange & sohne': 'A. Lange & Söhne',
  'a. lange and sohne': 'A. Lange & Söhne',
  // Patek Philippe — "Patek" alone is safe and extremely common
  'patek': 'Patek Philippe',
  // FP Journe
  'fp journe': 'FP Journe',
  'f.p. journe': 'FP Journe',
  'f.p journe': 'FP Journe',
  // H. Moser & Cie
  'h. moser': 'H. Moser & Cie',
  'moser': 'H. Moser & Cie',
  // Vacheron Constantin
  'vacheron': 'Vacheron Constantin',
  // Universal Genève
  'universal geneve': 'Universal Genève',
  'univ. genève': 'Universal Genève',
  'univ geneve': 'Universal Genève',
  // Bvlgari
  'bulgari': 'Bvlgari',
  // Frederique Constant
  'frederique constant': 'Frederique Constant',
  'frédérique constant': 'Frederique Constant',
  // Baume & Mercier
  'baume et mercier': 'Baume & Mercier',
  'baume and mercier': 'Baume & Mercier',
  // Hermès
  'hermes': 'Hermès',
  // Franck Muller spelling variants
  'franck müller': 'Franck Muller',
  'frank müller': 'Franck Muller',
  'frank muller': 'Franck Muller',
};

// ---------------------------------------------------------------------------
// Canonical brand list — ordered longest-first so that more specific names
// always match before shorter prefixes they contain:
//   "Grand Seiko" before "Seiko"
//   "TAG Heuer" before "Heuer"
//   "A. Lange & Söhne" before any Lange variant (handled by aliases first anyway)
// ---------------------------------------------------------------------------
export const CANONICAL_BRANDS: readonly string[] = [
  'Dubey & Schaldenbrand',
  'Frederique Constant',
  'Glashütte Original',
  'Vacheron Constantin',
  'Universal Genève',
  'Baume & Mercier',
  'Jaeger-LeCoultre',
  'A. Lange & Söhne',
  'Girard-Perregaux',
  'Audemars Piguet',
  'Patek Philippe',
  'H. Moser & Cie',
  'Porsche Design',
  'Franck Muller',
  'Ulysse Nardin',
  'Richard Mille',
  'Roger Dubuis',
  'Arnold & Son',
  'Raymond Weil',
  'Favre-Leuba',
  'Bell & Ross',
  'Grand Seiko',
  'King Seiko',
  'TAG Heuer',
  'De Bethune',
  'FP Journe',
  'MB&F',
  'Montblanc',
  'Blancpain',
  'Breitling',
  'Longines',
  'Hamilton',
  'Chopard',
  'Panerai',
  'Breguet',
  'Bvlgari',
  'Minerva',
  'Movado',
  'Cartier',
  'Junghans',
  'Hanhart',
  'Tutima',
  'Enicar',
  'Eterna',
  'Piaget',
  'Zenith',
  'Hublot',
  'Alpina',
  'Certina',
  'Heuer',
  'Tudor',
  'Omega',
  'Rolex',
  'Corum',
  'Ebel',
  'Rado',
  'Ball',
  'Sinn',
  'Nomos',
  'Stowa',
  'Laco',
  'IWC',
  'Tissot',
  'Seiko',
  'Orient',
  'Citizen',
  'Wittnauer',
  'Glycine',
  'Vulcain',
  'Bulova',
  'Waltham',
  'Elgin',
  'Doxa',
  'Zodiac',
  'Nivada',
  'Gruen',
  'Benrus',
  'Wakmann',
  'Gallet',
  'Aquadive',
  'Mido',
  'Lemania',
  'Lip',
  'Cyma',
  'Marvin',
  'Raketa',
  'Vostok',
  'Chanel',
  'Hermès',
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Try alias matches against a single text string. */
function matchAliases(text: string, allowShort: boolean): BrandMatch | null {
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    const isShort = alias.length <= SHORT_ALIAS_MAX;
    if (isShort && !allowShort) continue;

    let m: RegExpExecArray | null;
    if (isShort) {
      // Word-boundary match for short aliases to reduce false positives
      m = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').exec(text);
    } else {
      m = new RegExp(escapeRegex(alias), 'i').exec(text);
    }
    if (m) return { brand: canonical, matched: m[0] };
  }
  return null;
}

/** Try canonical brand substring matches against a single text string. */
function matchCanonical(text: string): BrandMatch | null {
  const upper = text.toUpperCase();
  for (const b of CANONICAL_BRANDS) {
    const idx = upper.indexOf(b.toUpperCase());
    if (idx !== -1) {
      return { brand: b, matched: text.slice(idx, idx + b.length) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Infer a watch brand from listing text fields.
 *
 * Priority:
 *   1. Aliases (title only for short ≤4-char aliases; title+description for long)
 *   2. Canonical brand list (title first, then description)
 *
 * Returns null when the brand cannot be confidently determined.
 */
export function inferBrand(title: string, description?: string): BrandMatch | null {
  // 1a. Short and long aliases on title
  const aliasInTitle = matchAliases(title, true);
  if (aliasInTitle) return aliasInTitle;

  // 1b. Canonical brands on title
  const canonicalInTitle = matchCanonical(title);
  if (canonicalInTitle) return canonicalInTitle;

  if (description) {
    // 2a. Long aliases only on description (skip short to avoid false positives in prose)
    const longAliasInDesc = matchAliases(description, false);
    if (longAliasInDesc) return longAliasInDesc;

    // 2b. Canonical brands on description
    const canonicalInDesc = matchCanonical(description);
    if (canonicalInDesc) return canonicalInDesc;
  }

  return null;
}
