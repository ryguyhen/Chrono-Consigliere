// Legacy /feed redirect — canonical URL is /friends
import { redirect } from 'next/navigation';

export default function FeedPage() {
  redirect('/friends');
}
