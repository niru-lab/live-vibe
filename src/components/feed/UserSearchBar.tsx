import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, X, Lock, GlobeHemisphereWest, Check, Plus } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useToggleFollow } from '@/hooks/useFollowStats';
import { useQueryClient } from '@tanstack/react-query';

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  profile_visibility: 'public' | 'followers' | 'private';
  is_following: boolean;
}

export const UserSearchBar = () => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data: myProfile } = useProfile();
  const toggleFollow = useToggleFollow();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['user-search', debounced, myProfile?.id],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debounced || debounced.length < 1) return [];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`)
        .limit(15);

      if (error || !profiles) return [];

      const ids = profiles.map((p) => p.id);
      if (ids.length === 0) return [];

      const [{ data: privacy }, { data: follows }] = await Promise.all([
        supabase.from('privacy_settings').select('profile_id, profile_visibility').in('profile_id', ids),
        myProfile?.id
          ? supabase.from('follows').select('following_id').eq('follower_id', myProfile.id).in('following_id', ids)
          : Promise.resolve({ data: [] as { following_id: string }[] }),
      ]);

      const privacyMap = new Map((privacy || []).map((p: any) => [p.profile_id, p.profile_visibility]));
      const followingSet = new Set((follows || []).map((f: any) => f.following_id));

      return profiles
        .filter((p) => p.id !== myProfile?.id)
        .map((p) => ({
          id: p.id,
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          profile_visibility: (privacyMap.get(p.id) as any) || 'public',
          is_following: followingSet.has(p.id),
        }));
    },
    enabled: debounced.length >= 1,
  });

  const handleFollow = (e: React.MouseEvent, r: SearchResult) => {
    e.stopPropagation();
    toggleFollow.mutate(
      { targetProfileId: r.id, isFollowing: r.is_following },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['user-search'] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
      },
    );
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <label
        className="flex items-center gap-2 h-9 px-3 rounded-full glass-pill cursor-text"
        onClick={() => inputRef.current?.focus()}
        style={{ touchAction: 'manipulation' }}
      >
        <MagnifyingGlass weight="thin" className="h-4 w-4 text-[#A0A0B0] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder="Accounts suchen…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-[#A0A0B0] outline-none min-w-0 w-full"
          style={{ fontSize: '16px' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setDebounced(''); }} className="shrink-0">
            <X weight="bold" className="h-3.5 w-3.5 text-[#A0A0B0]" />
          </button>
        )}
      </label>

      {open && debounced.length >= 1 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl"
          style={{ background: '#12121A' }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-xs text-[#A0A0B0]">Suche…</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#A0A0B0]">Keine Accounts gefunden</div>
          ) : (
            <ul className="py-1">
              {results.map((r) => {
                const isPrivate = r.profile_visibility === 'private' || r.profile_visibility === 'followers';
                const goProfile = () => {
                  setOpen(false);
                  setQuery('');
                  navigate(`/u/${r.username}`);
                };
                return (
                  <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] cursor-pointer" onClick={goProfile}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={r.avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-[#1A1A24] text-xs text-white">
                        {r.display_name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">{r.display_name}</span>
                        {isPrivate ? (
                          <Lock weight="fill" className="h-3 w-3 text-[#A0A0B0] shrink-0" />
                        ) : (
                          <GlobeHemisphereWest weight="fill" className="h-3 w-3 text-[#7C3AED] shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#A0A0B0] truncate">@{r.username}</div>
                    </div>
                    <button
                      onClick={(e) => handleFollow(e, r)}
                      disabled={toggleFollow.isPending}
                      className={`flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold shrink-0 transition-colors ${
                        r.is_following
                          ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                          : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                      }`}
                    >
                      {r.is_following ? (
                        <><Check weight="bold" className="h-3 w-3" /> Folgst du</>
                      ) : (
                        <><Plus weight="bold" className="h-3 w-3" /> Folgen</>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
