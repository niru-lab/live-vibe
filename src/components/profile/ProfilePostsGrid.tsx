import { useState } from 'react';
import { Grid3X3, Bookmark, Play, Heart, MessageCircle } from 'lucide-react';
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
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="posts" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Beiträge</span>
          </TabsTrigger>
          <TabsTrigger value="tagged" className="gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Markiert</span>
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
          {selectedPost && (
            <PostCard
              post={selectedPost}
              isLiked={likedPosts.includes(selectedPost.id)}
              onLike={handleLike}
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
      <div className="grid grid-cols-3 gap-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-sm" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Grid3X3 className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick(post)}
          className="group relative aspect-square overflow-hidden rounded-sm bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {post.media_type === 'video' ? (
            <>
              <video
                src={post.media_url}
                className="h-full w-full object-cover"
                muted
              />
              <div className="absolute right-1 top-1">
                <Play className="h-4 w-4 fill-white text-white drop-shadow-lg" />
              </div>
            </>
          ) : (
            <img
              src={post.media_url}
              alt={post.caption || 'Post'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-1 text-white">
              <Heart className="h-5 w-5 fill-white" />
              <span className="font-semibold">{post.likes_count}</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <MessageCircle className="h-5 w-5 fill-white" />
              <span className="font-semibold">{post.comments_count}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
