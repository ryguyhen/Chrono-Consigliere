// src/lib/auth/generate-username.ts
// Derives a unique username from an email address.

export function generateUsername(email: string): string {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user';
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}${suffix}`;
}
