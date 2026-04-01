// src/app/profile/page.tsx
// Redirects /profile to /profile/[username] for logged-in user
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/db';

export default async function ProfileRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = session.user.id;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { username: true },
  });

  if (!profile) redirect('/login');
  redirect(`/profile/${profile.username}`);
}
