import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts, useLikePost, useUserLikes } from '@/hooks/usePosts';
import { PostCard } from '@/components/feed/PostCard';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Zap, PartyPopper } from 'lucide-react';

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  const { data: posts, isLoading: postsLoading } = usePosts(selectedCity === 'all' ? undefined : selectedCity);
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-glow">
          <Zap className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <FeedHeader selectedCity={selectedCity} onCityChange={setSelectedCity} />
      
      <div className="px-4 pt-4">
        {postsLoading ? (
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
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
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
              <PartyPopper className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Noch keine Posts
            </h2>
            <p className="mb-6 max-w-xs text-muted-foreground">
              Sei der Erste, der einen Moment teilt und zeige, wo es gerade abgeht!
            </p>
            <Button 
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              Ersten Post erstellen
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
