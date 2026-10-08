import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useInfinitePosts, useLikePost, useUserLikes, type FeedMode } from '@/hooks/usePosts';
import { useProfile } from '@/hooks/useProfile';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { useTaggedPosts } from '@/hooks/useEvents';
import { useLivePosts } from '@/hooks/useLivePosts';
import { PostCard } from '@/components/feed/PostCard';
import { PostDetailDialog } from '@/components/feed/PostDetailDialog';
import { FeedHeader } from '@/components/feed/FeedHeader';
import type { PostWithAuthor } from '@/hooks/usePosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Lightning, Confetti, ArrowLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { useGuestActivation } from '@/hooks/useGuestActivation';
import { GuestFirstPostNudge } from '@/components/feed/GuestFirstPostNudge';
import { useFirstPostRescue, RESCUE_DISMISS_KEY } from '@/hooks/useFirstPostRescue';
import { trackNudge } from '@/lib/nudgeConfig';
import { FirstPostRescueCard } from '@/components/feed/FirstPostRescueCard';
import { useEngagementNudge, ENGAGEMENT_DISMISS_KEY } from '@/hooks/useEngagementNudge';
import { EngagementNudgeCard } from '@/components/feed/EngagementNudgeCard';

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const venueFilter = searchParams.get('venue');
  const postParam = searchParams.get('post');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [openPost, setOpenPost] = useState<PostWithAuthor | null>(null);
  const [mode, setMode] = useState<FeedMode>('all');
  const { data: myProfile } = useProfile();
  const feedQuery = useInfinitePosts({ city: selectedCity === 'all' ? undefined : selectedCity, mode, myCity: myProfile?.city });
  const rawPosts = useMemo(() => feedQuery.data?.pages.flat(), [feedQuery.data]);
  const postsLoading = feedQuery.isLoading;
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) feedQuery.fetchNextPage();
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, feedQuery.fetchNextPage]);
  const posts = useFeedAlgorithm(rawPosts);
  const { data: taggedPosts, isLoading: taggedLoading } = useTaggedPosts(venueFilter || undefined);
  const { data: likedPosts = [] } = useUserLikes();
  const likeMutation = useLikePost();
  const { isEligible: showGuestNudge, isLoading: activationLoading } = useGuestActivation();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const { isEligible: showRescue } = useFirstPostRescue();
  const [rescueDismissed, setRescueDismissed] = useState(false);
  const { isEligible: showEngagement, progress: engagementProgress } = useEngagementNudge();
  const [engagementDismissed, setEngagementDismissed] = useState(false);

  useLivePosts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Deep-link: /feed?post=<id> opens the PostDetailDialog for that post.
  useEffect(() => {
    if (!postParam) return;
    if (openPost?.id === postParam) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select(`*, author:profiles!posts_author_id_fkey(*), event:events(*), location:profiles!posts_location_id_fkey(*)`)
        .eq('id', postParam)
        .maybeSingle();
      if (!cancelled && data) setOpenPost(data as unknown as PostWithAuthor);
    })();
    return () => { cancelled = true; };
  }, [postParam, openPost?.id]);

  const handleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      likeMutation.mutate({ postId, isLiked });
    },
    [likeMutation],
  );


  const activePosts = (venueFilter ? taggedPosts : posts) as PostWithAuthor[] | undefined;
  const isLoading = venueFilter ? taggedLoading : postsLoading;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Lightning weight="thin" className="h-12 w-12 text-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <AppLayout>
      <FeedHeader selectedCity={selectedCity} onCityChange={setSelectedCity} />
      
      <div className="bg-background" style={{ padding: '8px 14px', minHeight: '100%' }}>
        {venueFilter && (
          <div className="mb-4 flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setSearchParams({})}>
              <ArrowLeft weight="bold" className="h-4 w-4" />
              Zurück zum Feed
            </Button>
            <span className="text-xs text-muted-foreground">
              Posts für Venue
            </span>
          </div>
        )}
        {!venueFilter && (
          <div className="mb-3 flex gap-2" role="tablist" aria-label="Feed-Filter">
            {([['all', 'Alle'], ['city', 'Meine Stadt'], ['onsite', 'Vor Ort']] as [FeedMode, string][]).map(([m, l]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${mode === m ? 'border-primary bg-primary/15 text-foreground' : 'border-border/50 text-muted-foreground hover:border-primary/50'}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        {isLoading || (!venueFilter && activationLoading) ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !venueFilter && showGuestNudge && !nudgeDismissed ? (
          <GuestFirstPostNudge
            onStart={() => navigate('/create?first=1')}
            onExplore={() => setNudgeDismissed(true)}
          />
        ) : activePosts && activePosts.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '10px' }}>
            {!venueFilter && showRescue && !rescueDismissed && (
              <FirstPostRescueCard
                onExplore={() => {
                  trackNudge('nudge_cta_clicked', 'first_post_rescue');
                  localStorage.setItem(RESCUE_DISMISS_KEY, '1');
                  setRescueDismissed(true);
                  navigate('/discover');
                }}
                onDismiss={() => {
                  trackNudge('nudge_dismissed', 'first_post_rescue');
                  localStorage.setItem(RESCUE_DISMISS_KEY, '1');
                  setRescueDismissed(true);
                }}
              />
            )}
            {!venueFilter &&
              !(showRescue && !rescueDismissed) &&
              showEngagement &&
              engagementProgress &&
              !engagementDismissed && (
                <EngagementNudgeCard
                  progress={engagementProgress}
                  onDiscover={() => navigate('/discover')}
                  onDismiss={() => {
                    localStorage.setItem(ENGAGEMENT_DISMISS_KEY, '1');
                    setEngagementDismissed(true);
                  }}
                />
              )}
            {activePosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setOpenPost(post)}
                className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-[18px]"
              >
                <PostCard
                  post={post}
                  isLiked={likedPosts.includes(post.id)}
                  onLike={handleLike}
                />
              </button>
            ))}
            {!venueFilter && <div ref={sentinelRef} className="h-8" aria-hidden />}
            {feedQuery.isFetchingNextPage && <Skeleton className="h-40 w-full rounded-[18px]" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Confetti weight="thin" className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {venueFilter ? 'Keine Posts für diese Location' : 'Noch keine Posts'}
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              {venueFilter 
                ? 'Für diese Location wurden noch keine Posts geteilt.'
                : 'Sei der Erste, der einen Moment teilt und zeige, wo es gerade abgeht!'}
            </p>
            {venueFilter ? (
              <Button onClick={() => setSearchParams({})} variant="outline">
                Zurück zum Feed
              </Button>
            ) : (
              <Button onClick={() => navigate('/create')} variant="outline">
                Ersten Post erstellen
              </Button>
            )}
          </div>
        )}
      </div>

      <PostDetailDialog
        post={openPost}
        isLiked={openPost ? likedPosts.includes(openPost.id) : false}
        onLike={handleLike}
        onClose={() => {
          setOpenPost(null);
          if (postParam) {
            const next = new URLSearchParams(searchParams);
            next.delete('post');
            setSearchParams(next, { replace: true });
          }
        }}
      />
    </AppLayout>
  );
}
