// src/lib/auth/generate-username.ts
// Derives a unique username from an email address.

export function generateUsername(email: string): string {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user';
  // Use a 6-char base-36 random suffix (~2B combinations) to avoid username collisions
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}_${suffix}`;
}
