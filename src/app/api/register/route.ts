// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUsername } from '@/lib/auth/generate-username';

export async function POST(req: Request) {
  const { name, email } = await req.json().catch(() => ({}));

  if (!email || !name) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const uniqueUsername = generateUsername(email);

  await prisma.user.create({
    data: {
      email,
      name,
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
