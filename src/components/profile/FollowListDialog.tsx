import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFollowers, useFollowing, useMutualLikedPosts, type FollowProfile, type MutualLikedPost } from '@/hooks/useFollowLists';
import { useProfile } from '@/hooks/useProfile';
import { Users, Heart } from '@phosphor-icons/react';

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  defaultTab?: 'followers' | 'following' | 'likes';
  followersCount: number;
  followingCount: number;
}

export const FollowListDialog = ({ open, onOpenChange, profileId, defaultTab = 'followers', followersCount, followingCount }: FollowListDialogProps) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'likes'>(defaultTab);
  const { data: myProfile } = useProfile();
  const { data: followers, isLoading: loadingFollowers } = useFollowers(profileId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(profileId);
  const isOwnProfile = myProfile?.id === profileId;
  const { data: mutualLikedPosts, isLoading: loadingMutualLikes } = useMutualLikedPosts(isOwnProfile ? undefined : profileId);

  const mutualCount = useMemo(() => (followers || []).filter((p) => p.is_mutual).length, [followers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text text-center">Verbindungen</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-2' : 'grid-cols-3'} glass`}>
            <TabsTrigger value="followers" className="data-[state=active]:bg-primary/20 text-xs">Follower ({followersCount})</TabsTrigger>
            <TabsTrigger value="following" className="data-[state=active]:bg-primary/20 text-xs">Folge ich ({followingCount})</TabsTrigger>
            {!isOwnProfile && (
              <TabsTrigger value="likes" className="data-[state=active]:bg-primary/20 text-xs">Likes</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="followers" className="mt-4 max-h-[55vh] overflow-y-auto">
            {!isOwnProfile && mutualCount > 0 && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Users weight="fill" className="h-4 w-4 text-primary" />
                <span className="text-xs text-foreground">
                  <span className="font-semibold text-primary">{mutualCount}</span> gemeinsame Follower
                </span>
              </div>
            )}
            <ProfileList
              profiles={sortMutualFirst(followers, !isOwnProfile)}
              isLoading={loadingFollowers}
              emptyMessage="Noch keine Follower"
              onClose={() => onOpenChange(false)}
              showMutualBadge={!isOwnProfile}
            />
          </TabsContent>
          <TabsContent value="following" className="mt-4 max-h-[55vh] overflow-y-auto">
            <ProfileList
              profiles={sortMutualFirst(following, !isOwnProfile)}
              isLoading={loadingFollowing}
              emptyMessage="Folgt noch niemandem"
              onClose={() => onOpenChange(false)}
              showMutualBadge={!isOwnProfile}
            />
          </TabsContent>
          {!isOwnProfile && (
            <TabsContent value="likes" className="mt-4 max-h-[55vh] overflow-y-auto">
              <MutualLikesList posts={mutualLikedPosts || []} isLoading={loadingMutualLikes} onClose={() => onOpenChange(false)} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const sortMutualFirst = (profiles: FollowProfile[] | undefined, enabled: boolean): FollowProfile[] => {
  if (!profiles) return [];
  if (!enabled) return profiles;
  return [...profiles].sort((a, b) => Number(b.is_mutual) - Number(a.is_mutual));
};

const ProfileList = ({
  profiles,
  isLoading,
  emptyMessage,
  onClose,
  showMutualBadge,
}: {
  profiles: FollowProfile[];
  isLoading: boolean;
  emptyMessage: string;
  onClose: () => void;
  showMutualBadge?: boolean;
}) => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full glass">
          <Users weight="thin" className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => { onClose(); navigate(`/u/${profile.username}`); }}
          className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/10 transition-colors text-left"
        >
          <Avatar className="h-12 w-12 ring-2 ring-white/10">
            <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="bg-gradient-neon text-white font-bold">
              {profile.display_name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{profile.display_name}</p>
              {showMutualBadge && profile.is_mutual && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium border border-primary/30 shrink-0">
                  Gemeinsam
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

const MutualLikesList = ({ posts, isLoading, onClose }: { posts: MutualLikedPost[]; isLoading: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full glass">
          <Heart weight="thin" className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Noch keine Beiträge dieser Person<br />wurden von gemeinsamen Followern geliked</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <button
          key={post.post_id}
          onClick={() => { onClose(); navigate(`/?post=${post.post_id}`); }}
          className="w-full flex items-center gap-3 p-2 rounded-xl glass hover:bg-white/10 transition-colors text-left"
        >
          <div className="h-16 w-16 rounded-lg overflow-hidden bg-[#12121A] shrink-0">
            {post.media_type === 'video' ? (
              <video src={post.media_url} className="h-full w-full object-cover" muted />
            ) : (
              <img src={post.media_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center -space-x-2 mb-1">
              {post.likers.slice(0, 3).map((liker) => (
                <Avatar key={liker.id} className="h-6 w-6 ring-2 ring-background">
                  <AvatarImage src={liker.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-gradient-neon text-white text-[10px] font-bold">
                    {liker.display_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-foreground line-clamp-1">
              <Heart weight="fill" className="h-3 w-3 inline text-primary mr-1" />
              <span className="font-semibold">{post.likers[0]?.display_name}</span>
              {post.likers.length > 1 && (
                <span className="text-muted-foreground"> und {post.likers.length - 1} weitere{post.likers.length - 1 === 1 ? 'r' : ''}</span>
              )}
            </p>
            {post.caption && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{post.caption}</p>}
          </div>
        </button>
      ))}
    </div>
  );
};
