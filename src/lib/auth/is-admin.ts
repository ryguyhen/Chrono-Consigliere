// src/lib/auth/is-admin.ts
// Single source of truth for admin email check.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return ADMIN_EMAILS.includes(email);
}
