// src/middleware.ts
// Redirects authenticated users away from auth-only surfaces (/login, /register).
// Keeps the matcher minimal — only runs on the two routes where it matters.
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  if (token) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register'],
};
