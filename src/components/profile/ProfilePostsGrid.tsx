import { useState } from 'react';
import { SquaresFour, BookmarkSimple, Play, Heart, ChatCircle, MusicNote } from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostCard } from '@/components/feed/PostCard';
import { useUserPosts, useTaggedPosts } from '@/hooks/useUserPosts';
import { useUserLikes, useLikePost } from '@/hooks/usePosts';
import type { PostWithAuthor } from '@/hooks/usePosts';

interface ProfilePostsGridProps { profileId?: string; }

export const ProfilePostsGrid = ({ profileId }: ProfilePostsGridProps) => {
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(profileId);
  const { data: taggedPosts, isLoading: taggedLoading } = useTaggedPosts(profileId);
  const { data: likedPosts = [] } = useUserLikes();
  const likeMutation = useLikePost();
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const handleLike = (postId: string, isLiked: boolean) => { likeMutation.mutate({ postId, isLiked }); };

  return (
    <div className="mt-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/[0.08] rounded-none p-0 h-auto">
          <TabsTrigger value="posts" className="gap-2 rounded-none bg-transparent py-3 text-[#A0A0B0] data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
            <SquaresFour weight="bold" className="h-4 w-4" /><span>Beiträge</span>
          </TabsTrigger>
          <TabsTrigger value="tagged" className="gap-2 rounded-none bg-transparent py-3 text-[#A0A0B0] data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:tab-underline-active data-[state=active]:shadow-none">
            <BookmarkSimple weight="bold" className="h-4 w-4" /><span>Markiert</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4"><PostsGrid posts={userPosts} isLoading={postsLoading} onPostClick={setSelectedPost} emptyMessage="Noch keine Beiträge" /></TabsContent>
        <TabsContent value="tagged" className="mt-4"><PostsGrid posts={taggedPosts} isLoading={taggedLoading} onPostClick={setSelectedPost} emptyMessage="Noch keine Markierungen" /></TabsContent>
      </Tabs>
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0 rounded-3xl border-white/10">
          {selectedPost && <PostCard post={selectedPost} isLiked={likedPosts.includes(selectedPost.id)} onLike={handleLike} onDeleted={() => setSelectedPost(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PostsGrid = ({ posts, isLoading, onPostClick, emptyMessage }: { posts?: PostWithAuthor[]; isLoading: boolean; onPostClick: (post: PostWithAuthor) => void; emptyMessage: string }) => {
  if (isLoading) return (<div className="masonry-grid">{[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-xl" />)}</div>);
  if (!posts || posts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4"><SquaresFour weight="thin" className="h-10 w-10 text-muted-foreground" /></div>
      <p className="text-muted-foreground">{emptyMessage}</p>
    </div>
  );
  return (
    <div className="masonry-grid">
      {posts.map((post) => {
        const isLive = (post as any).post_type === 'moment_x' || (new Date().getTime() - new Date(post.created_at).getTime()) < 30 * 60 * 1000;
        return (
          <button key={post.id} onClick={() => onPostClick(post)} className="group relative aspect-square overflow-hidden rounded-lg bg-[#12121A] focus:outline-none transition-all duration-300 hover:scale-[1.03] hover:z-10">
            {post.media_type === 'video' ? (
              <><video src={post.media_url} className="h-full w-full object-cover" muted /><div className="absolute right-2 top-2 glass rounded-full p-1.5"><Play weight="fill" className="h-3 w-3 text-white" /></div></>
            ) : (
              <img src={post.media_url} alt={post.caption || 'Post'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" onError={(e) => { const img = e.currentTarget; img.style.display = 'none'; const parent = img.parentElement; if (parent) { const fallback = document.createElement('div'); fallback.className = 'flex items-center justify-center h-full w-full absolute inset-0 bg-muted'; fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="none"><rect width="256" height="256" rx="8" fill="none"/><path d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16ZM40 56h176v94.75l-46.75-46.75a8 8 0 0 0-11.32 0L99.31 162.62 76.69 140a8 8 0 0 0-11.32 0L40 165.38Zm0 144v-15.38l36-36 22.75 22.75a8 8 0 0 0 11.32 0L168 113.25 216 161.25V200Z" fill="hsl(0 0% 40%)"/><circle cx="100" cy="108" r="20" fill="hsl(0 0% 40%)"/></svg>'; parent.appendChild(fallback); } }} />
            )}
            {isLive && <div className="absolute left-2 top-2 flex items-center gap-1 glass rounded-full px-2 py-1"><div className="h-2 w-2 rounded-full bg-destructive live-pulse" /><span className="text-[10px] font-bold text-white">LIVE</span></div>}
            {post.music_url && <div className="absolute bottom-2 left-2 flex items-center gap-1.5 glass rounded-full px-2 py-1"><MusicNote weight="thin" className="h-3 w-3 text-white" /><div className="music-dots"><div className="music-dot" /><div className="music-dot" /><div className="music-dot" /><div className="music-dot" /></div></div>}
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-1.5 text-white"><Heart weight="fill" className="h-5 w-5" /><span className="font-bold">{post.likes_count}</span></div>
              <div className="flex items-center gap-1.5 text-white"><ChatCircle weight="fill" className="h-5 w-5" /><span className="font-bold">{post.comments_count}</span></div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
