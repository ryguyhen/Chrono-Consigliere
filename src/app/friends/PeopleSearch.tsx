'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface UserResult {
  id: string;
  username: string;
  displayName: string | null;
  tasteTags: string[];
  isFollowing: boolean;
  followerCount: number;
}

function Avatar({ name, size = 36 }: { name: string | null; size?: number }) {
  const initials = (name ?? 'U').slice(0, 2).toUpperCase();
  const hue = (initials.charCodeAt(0) * 37 + (initials.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white/70 font-medium"
      style={{ width: size, height: size, fontSize: size * 0.32, background: `hsl(${hue}, 15%, 22%)` }}
    >
      {initials}
    </div>
  );
}

export default function PeopleSearch({ initialSuggested }: { initialSuggested: UserResult[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function toggleFollow(userId: string, currently: boolean) {
    const optimistic = !currently;
    setFollowing(prev => ({ ...prev, [userId]: optimistic }));
    setResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: optimistic } : u));
    const method = currently ? 'DELETE' : 'POST';
    const res = await fetch(`/api/follow/${userId}`, { method });
    if (!res.ok) {
      setFollowing(prev => ({ ...prev, [userId]: currently }));
      setResults(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: currently } : u));
    }
  }

  const displayList = query.length >= 2 ? results : initialSuggested;
  const showLabel = query.length < 2 && initialSuggested.length > 0;

  return (
    <div>
      <div className="relative mb-5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find people by name or username…"
          className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-parchment text-[13px] text-ink outline-none focus:border-gold transition-colors pr-10 placeholder:text-muted/50"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        )}
      </div>

      {query.length >= 2 && results.length === 0 && !loading && (
        <div className="text-center py-8 text-muted text-[13px]">Nobody found for "{query}"</div>
      )}

      {showLabel && (
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted mb-3">
          Worth following
        </div>
      )}

      {displayList.length > 0 && (
        <div className="space-y-2">
          {displayList.map(user => {
            const isFollowingUser = following[user.id] ?? user.isFollowing;
            return (
              <div key={user.id} className="bg-surface border border-[var(--border)] rounded-lg p-3.5 flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <Avatar name={user.displayName ?? user.username} size={36} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.username}`} className="hover:text-gold transition-colors">
                    <div className="text-[13px] font-medium text-ink truncate">{user.displayName ?? user.username}</div>
                    <div className="text-[10px] text-muted">@{user.username}</div>
                  </Link>
                  {user.tasteTags.length > 0 && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {user.tasteTags.slice(0, 3).map(tag => (
                        <span key={tag} className="font-mono text-[8px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border border-gold/25 text-gold/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleFollow(user.id, isFollowingUser)}
                  className={`font-mono text-[9px] tracking-[0.08em] uppercase px-3 py-2 rounded border transition-colors whitespace-nowrap flex-shrink-0
                    ${isFollowingUser
                      ? 'bg-gold border-gold text-black font-bold'
                      : 'border-[var(--border)] text-muted hover:border-gold/60 hover:text-gold'
                    }`}
                >
                  {isFollowingUser ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
