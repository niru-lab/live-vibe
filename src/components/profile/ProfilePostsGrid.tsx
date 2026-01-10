import { useState } from 'react';
import { Grid3X3, Bookmark, Play, Heart, MessageCircle, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostCard } from '@/components/feed/PostCard';
import { useUserPosts, useTaggedPosts } from '@/hooks/useUserPosts';
import { useUserLikes, useLikePost } from '@/hooks/usePosts';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface ProfilePostsGridProps {
  profileId?: string;
}

export const ProfilePostsGrid = ({ profileId }: ProfilePostsGridProps) => {
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(profileId);
  const { data: taggedPosts, isLoading: taggedLoading } = useTaggedPosts(profileId);
  const { data: likedPosts = [] } = useUserLikes();
  const likeMutation = useLikePost();
  
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);

  const handleLike = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, isLiked });
  };

  return (
    <div className="mt-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass rounded-2xl p-1">
          <TabsTrigger 
            value="posts" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white"
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Beiträge</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tagged" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white"
          >
            <Bookmark className="h-4 w-4" />
            <span>Markiert</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <PostsGrid 
            posts={userPosts} 
            isLoading={postsLoading} 
            onPostClick={setSelectedPost}
            emptyMessage="Noch keine Beiträge"
          />
        </TabsContent>

        <TabsContent value="tagged" className="mt-4">
          <PostsGrid 
            posts={taggedPosts} 
            isLoading={taggedLoading} 
            onPostClick={setSelectedPost}
            emptyMessage="Noch keine Markierungen"
          />
        </TabsContent>
      </Tabs>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0 rounded-3xl border-white/10">
          {selectedPost && (
            <PostCard
              post={selectedPost}
              isLiked={likedPosts.includes(selectedPost.id)}
              onLike={handleLike}
              onDeleted={() => setSelectedPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PostsGridProps {
  posts?: PostWithAuthor[];
  isLoading: boolean;
  onPostClick: (post: PostWithAuthor) => void;
  emptyMessage: string;
}

const PostsGrid = ({ posts, isLoading, onPostClick, emptyMessage }: PostsGridProps) => {
  if (isLoading) {
    return (
      <div className="masonry-grid">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4 neon-glow-sm">
          <Grid3X3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {posts.map((post) => {
        const isLive = (post as any).post_type === 'moment_x' || 
          (new Date().getTime() - new Date(post.created_at).getTime()) < 30 * 60 * 1000;
        
        return (
          <button
            key={post.id}
            onClick={() => onPostClick(post)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted focus:outline-none transition-all duration-300 hover:scale-[1.03] hover:z-10"
          >
            {post.media_type === 'video' ? (
              <>
                <video
                  src={post.media_url}
                  className="h-full w-full object-cover"
                  muted
                />
                <div className="absolute right-2 top-2 glass rounded-full p-1.5">
                  <Play className="h-3 w-3 fill-white text-white" />
                </div>
              </>
            ) : (
              <img
                src={post.media_url}
                alt={post.caption || 'Post'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            )}

            {/* Live Indicator */}
            {isLive && (
              <div className="absolute left-2 top-2 flex items-center gap-1 glass rounded-full px-2 py-1">
                <div className="h-2 w-2 rounded-full bg-red-500 live-pulse" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            )}

            {/* Music Preview Dots */}
            {post.music_url && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 glass rounded-full px-2 py-1">
                <Music className="h-3 w-3 text-white" />
                <div className="music-dots">
                  <div className="music-dot" />
                  <div className="music-dot" />
                  <div className="music-dot" />
                  <div className="music-dot" />
                </div>
              </div>
            )}
            
            {/* Hover overlay with stats */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-1.5 text-white">
                <Heart className="h-5 w-5 fill-white" />
                <span className="font-bold">{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <MessageCircle className="h-5 w-5 fill-white" />
                <span className="font-bold">{post.comments_count}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
