// src/lib/auth/auth.config.ts
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import { prisma } from '@/lib/db';

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
    // Email/password for dev and MVP
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        // For MVP: simplified auth — in prod use bcrypt + hashed passwords
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        // TODO: in production, verify credentials.password against hashed pw
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user }) {
      // Auto-create profile on first sign-in
      if (user.id) {
        const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
        if (!existing && user.email) {
          const username = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
          await prisma.profile.create({
            data: {
              userId: user.id,
              username: `${username}${Math.floor(Math.random() * 999)}`,
              displayName: user.name ?? undefined,
            },
          });
        }
      }
      return true;
    },
  },
};
