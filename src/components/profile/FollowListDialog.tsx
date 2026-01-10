import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFollowers, useFollowing, type FollowProfile } from '@/hooks/useFollowLists';
import { Users } from 'lucide-react';

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
  defaultTab?: 'followers' | 'following';
  followersCount: number;
  followingCount: number;
}

export const FollowListDialog = ({
  open,
  onOpenChange,
  profileId,
  defaultTab = 'followers',
  followersCount,
  followingCount,
}: FollowListDialogProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { data: followers, isLoading: loadingFollowers } = useFollowers(profileId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(profileId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 max-w-md max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="gradient-text text-center">Verbindungen</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'followers' | 'following')}>
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="followers" className="data-[state=active]:bg-primary/20">
              Follower ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following" className="data-[state=active]:bg-primary/20">
              Folge ich ({followingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4 max-h-[45vh] overflow-y-auto">
            <ProfileList 
              profiles={followers || []} 
              isLoading={loadingFollowers} 
              emptyMessage="Noch keine Follower"
            />
          </TabsContent>

          <TabsContent value="following" className="mt-4 max-h-[45vh] overflow-y-auto">
            <ProfileList 
              profiles={following || []} 
              isLoading={loadingFollowing}
              emptyMessage="Folgt noch niemandem"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface ProfileListProps {
  profiles: FollowProfile[];
  isLoading: boolean;
  emptyMessage: string;
}

const ProfileList = ({ profiles, isLoading, emptyMessage }: ProfileListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full glass">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/10 transition-colors"
        >
          <Avatar className="h-12 w-12 ring-2 ring-white/10">
            <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="bg-gradient-neon text-white font-bold">
              {profile.display_name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{profile.display_name}</p>
            <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
