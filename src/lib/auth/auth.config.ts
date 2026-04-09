// src/lib/auth/auth.config.ts
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateUsername } from '@/lib/auth/generate-username';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });

        // No account, or account was created via OAuth (no passwordHash)
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    /**
     * signIn runs BEFORE the adapter does its DB work.
     * At this point user.id is the OAuth provider's ID, not the DB CUID.
     *
     * We use this callback solely to pre-link Google accounts for existing
     * credentials users, which prevents NextAuth from throwing OAuthAccountNotLinked.
     * Profile creation is intentionally deferred to the jwt callback where the
     * real DB user ID is available.
     */
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user.email || !account.providerAccountId) {
        return true;
      }

      try {
        // Check if a DB user exists with this email but no linked Google account.
        // This happens when someone registered with credentials and then tries Google.
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            image: true,
            accounts: { where: { provider: 'google' }, select: { id: true } },
          },
        });

        if (existingUser && existingUser.accounts.length === 0) {
          // Pre-link the Google account to the existing DB user.
          // This runs before NextAuth's adapter lookup, so getUserByAccount will
          // now find this record and skip the OAuthAccountNotLinked error path.
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type ?? 'oauth',
              provider: 'google',
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: (account.session_state as string | null) ?? null,
            },
          });
          // Backfill profile image from Google if not already set
          if (!existingUser.image && user.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image },
            });
          }
        }
      } catch (err) {
        // Log but don't block sign-in — worst case is OAuthAccountNotLinked shown to user
        console.error('[auth] signIn Google account-link error:', err);
      }

      return true;
    },

    /**
     * jwt runs AFTER the adapter has created/found the DB user.
     * user.id here is the real DB CUID.
     *
     * We create the Profile here (first sign-in only) because this is the
     * earliest point where we have a valid DB user ID to reference.
     */
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
      }

      // Create profile on first sign-in (trigger is 'signIn' for existing users,
      // 'signUp' for brand-new users created by the adapter)
      if ((trigger === 'signIn' || trigger === 'signUp') && user?.id) {
        try {
          const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
          if (!existing && user.email) {
            await prisma.profile.create({
              data: {
                userId: user.id,
                username: generateUsername(user.email),
                displayName: user.name ?? undefined,
              },
            });
          }
        } catch (err) {
          // Username collision or other transient error — log, don't block sign-in
          console.error('[auth] jwt profile auto-create error:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
