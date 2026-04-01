// src/types/next-auth.d.ts
// Augment next-auth Session so session.user.id is typed without `as any` casts.
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
