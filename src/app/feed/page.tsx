// src/app/feed/page.tsx
import { redirect } from 'next/navigation';

export default function FeedPage() {
  redirect('/roll?tab=friends');
}
