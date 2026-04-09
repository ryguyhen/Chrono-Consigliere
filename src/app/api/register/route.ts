// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateUsername } from '@/lib/auth/generate-username';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });
  if (existing) {
    // Distinguish legacy accounts (no password) from normal conflicts so the UI
    // can route the user to set-password instead of a dead-end error.
    if (!existing.passwordHash) {
      return NextResponse.json(
        { error: 'An account with this email already exists but has no password. Set a password to sign in.', code: 'LEGACY_ACCOUNT' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'An account with that email already exists.', code: 'EMAIL_TAKEN' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const uniqueUsername = generateUsername(email);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      profile: {
        create: {
          username: uniqueUsername,
          displayName: name,
        },
      },
    },
  });

  return NextResponse.json({ success: true });
}
