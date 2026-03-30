// src/app/layout.tsx
import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit, DM_Mono } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { Nav } from '@/components/layout/Nav';
import { Providers } from '@/components/layout/Providers';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-outfit',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'Chrono Consigliere — Social Watch Discovery',
  description: 'Discover, curate, and share the watches you love. A social watch discovery engine for people with taste.',
  openGraph: {
    title: 'Chrono Consigliere',
    description: 'A social watch discovery engine for people with taste.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} ${dmMono.variable}`}>
      <body className="bg-cream text-ink font-sans antialiased">
        <Providers>
          <Nav session={session} />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
