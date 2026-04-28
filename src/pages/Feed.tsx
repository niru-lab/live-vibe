import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts, useLikePost, useUserLikes } from '@/hooks/usePosts';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { useTaggedPosts } from '@/hooks/useEvents';
import { PostCard } from '@/components/feed/PostCard';
import { PostDetailDialog } from '@/components/feed/PostDetailDialog';
import { FeedHeader } from '@/components/feed/FeedHeader';
import type { PostWithAuthor } from '@/hooks/usePosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Lightning, Confetti, ArrowLeft } from '@phosphor-icons/react';

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const venueFilter = searchParams.get('venue');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  const { data: rawPosts, isLoading: postsLoading } = usePosts(selectedCity === 'all' ? undefined : selectedCity);
  const posts = useFeedAlgorithm(rawPosts);
  const { data: taggedPosts, isLoading: taggedLoading } = useTaggedPosts(venueFilter || undefined);
  const { data: likedPosts = [] } = useUserLikes();
  const likeMutation = useLikePost();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleLike = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, isLiked });
  };

  const activePosts = venueFilter ? taggedPosts : posts;
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
      
      <div style={{ background: '#0A0A0F', padding: '8px 14px', minHeight: '100%' }}>
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
        {isLoading ? (
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
        ) : activePosts && activePosts.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '10px' }}>
            {activePosts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={likedPosts.includes(post.id)}
                onLike={handleLike}
              />
            ))}
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
    </AppLayout>
  );
}
