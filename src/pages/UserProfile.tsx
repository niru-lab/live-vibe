import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, DotsThree, ChatCircleDots, Prohibit, Check, Plus, Lock } from '@phosphor-icons/react';
import { useProfile } from '@/hooks/useProfile';
import { useFollowStats, usePostsCount, useIsFollowing, useToggleFollow } from '@/hooks/useFollowStats';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useBlockUser } from '@/hooks/useDirectMessages';
import { useUserLikes, useLikePost, type PostWithAuthor } from '@/hooks/usePosts';
import { PostDetailDialog } from '@/components/feed/PostDetailDialog';
import { SendMessageDialog } from '@/components/messaging/SendMessageDialog';
import { toast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: myProfile } = useProfile();
  const queryClient = useQueryClient();
  const [messageOpen, setMessageOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const { data: likedPosts = [] } = useUserLikes();
  const likeMutation = useLikePost();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-by-username', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const isOwn = myProfile?.id === profile?.id;
  const { data: followStats } = useFollowStats(profile?.id);
  const { data: postsCount } = usePostsCount(profile?.id);
  const { data: isFollowing } = useIsFollowing(profile?.id);
  const { data: posts } = useUserPosts(profile?.id);
  const toggleFollow = useToggleFollow();
  const blockUser = useBlockUser();

  // Redirect to own profile page if user lands on their own
  if (isOwn) {
    navigate('/profile', { replace: true });
    return null;
  }

  const handleBlock = async () => {
    if (!profile) return;
    try {
      await blockUser.mutateAsync(profile.id);
      toast({ title: 'Blockiert', description: `@${profile.username} wurde blockiert.` });
      navigate(-1);
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    }
  };

  const handleFollow = () => {
    if (!profile) return;
    toggleFollow.mutate(
      { targetProfileId: profile.id, isFollowing: !!isFollowing },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#0A0A0F] p-4 space-y-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white text-lg font-bold mb-2">Profil nicht gefunden</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Zurück</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="fixed inset-0 -z-10 bg-[#0A0A0F]" />
      <div className="min-h-screen" data-testid="profile-container">
        <header className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill" onClick={() => navigate(-1)}>
            <ArrowLeft weight="bold" className="h-4 w-4 text-white" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill">
                <DotsThree weight="bold" className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#12121A] border-white/[0.08] text-white min-w-[180px]">
              <DropdownMenuItem onClick={() => setMessageOpen(true)} className="gap-2 cursor-pointer focus:bg-white/[0.06] focus:text-white">
                <ChatCircleDots weight="bold" className="h-4 w-4" />
                Nachricht senden
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.08]" />
              <DropdownMenuItem onClick={() => setBlockConfirmOpen(true)} className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400">
                <Prohibit weight="bold" className="h-4 w-4" />
                Blockieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="px-4 pb-24 space-y-5">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08]" style={{ background: '#12121A' }}>
            <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18), transparent 60%)' }} />
            <div className="relative p-6 flex flex-col items-center text-center">
              <Avatar className="h-[84px] w-[84px] border-2" style={{ borderColor: '#0A0A0F' }}>
                <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="bg-[#1A1A24] text-xl text-white font-bold">{profile.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <p className="mt-3 text-base font-bold text-white">{profile.display_name}</p>
              <p data-testid="profile-username" className="text-sm text-[#A0A0B0]">@{profile.username}</p>
              {profile.bio && <p className="mt-3 text-xs max-w-xs leading-relaxed text-[#A0A0B0]">{profile.bio}</p>}

              <div className="mt-5 grid grid-cols-3 w-full max-w-[280px]">
                <div className="flex flex-col items-center px-2">
                  <span className="text-white font-bold text-[24px] leading-tight">{postsCount || 0}</span>
                  <span className="text-[12px] mt-0.5 text-[#A0A0B0]">Posts</span>
                </div>
                <div className="flex flex-col items-center px-2 border-x border-white/[0.08]">
                  <span data-testid="follower-count" className="text-white font-bold text-[24px] leading-tight">{followStats?.followers || 0}</span>
                  <span className="text-[12px] mt-0.5 text-[#A0A0B0]">Followers</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-white font-bold text-[24px] leading-tight">{followStats?.following || 0}</span>
                  <span className="text-[12px] mt-0.5 text-[#A0A0B0]">Folgt</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2 w-full max-w-[280px]">
                <Button
                  data-testid="follow-btn"
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                  className={`flex-1 gap-1.5 ${isFollowing ? 'bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.1]' : 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0'}`}
                >
                  {isFollowing ? <><Check weight="bold" className="h-4 w-4" /> Following</> : <><Plus weight="bold" className="h-4 w-4" /> Folgen</>}
                </Button>
                <Button data-testid="message-btn" onClick={() => setMessageOpen(true)} variant="outline" size="icon" className="bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1]">
                  <ChatCircleDots weight="bold" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Posts grid */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Beiträge</h2>
            {!posts || posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-white/[0.04] bg-[#12121A]">
                <Lock weight="thin" className="h-8 w-8 text-[#A0A0B0] mb-2" />
                <p className="text-sm text-[#A0A0B0]">Noch keine Beiträge</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPost(p as unknown as PostWithAuthor)}
                    className="aspect-square overflow-hidden rounded-md bg-[#12121A] hover:opacity-80 transition-opacity"
                  >
                    {p.media_type === 'video' ? (
                      <video src={p.media_url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={p.media_url} alt={p.caption || ''} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SendMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipient={{ id: profile.id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }}
      />

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent className="bg-[#12121A] border-white/[0.08] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">@{profile.username} blockieren?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A0A0B0]">
              Diese Person kann dich nicht mehr finden, dir folgen oder dir Nachrichten senden. Du kannst die Blockierung später aufheben.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.1]">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-red-500 hover:bg-red-600 text-white">
              Blockieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PostDetailDialog
        post={selectedPost}
        isLiked={selectedPost ? likedPosts.includes(selectedPost.id) : false}
        onLike={(postId, isLiked) => likeMutation.mutate({ postId, isLiked })}
        onClose={() => setSelectedPost(null)}
      />
    </AppLayout>
  );
}
