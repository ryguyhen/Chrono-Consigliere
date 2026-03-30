// src/app/wishlist/page.tsx
import { redirect } from 'next/navigation';

export default function WishlistPage({ searchParams }: { searchParams: { collection?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.collection) params.set('collection', searchParams.collection);
  const qs = params.toString();
  redirect(`/roll${qs ? `?${qs}` : ''}`);
}
