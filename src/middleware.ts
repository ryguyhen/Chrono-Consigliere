// src/middleware.ts
// Redirects authenticated users away from auth-only surfaces (/login, /register).
// Honors the ?from= param so already-authenticated users land at the right place.
// Keeps the matcher minimal — only runs on the two routes where it matters.
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

function safeRedirectPath(raw: string | null): string {
  // Only allow same-origin relative paths — block absolute URLs and protocol-relative //
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  if (token) {
    const from = safeRedirectPath(req.nextUrl.searchParams.get('from'));
    return NextResponse.redirect(new URL(from, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register'],
};
