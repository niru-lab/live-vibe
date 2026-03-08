import { useState } from 'react';
import { DotsThree, Cloud } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileSettings } from './ProfileSettings';
import { AchievementsView } from './AchievementsView';
import { FollowListDialog } from './FollowListDialog';
import { useBadgeSystem } from '@/hooks/useBadgeSystem';
import { cn } from '@/lib/utils';
import type { Profile } from '@/hooks/useProfile';

interface ProfileHeaderProps {
  profile: Profile | null;
  isLoading: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export const ProfileHeader = ({ profile, isLoading, followersCount, followingCount, postsCount }: ProfileHeaderProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const { data: badgeData } = useBadgeSystem(profile?.id);

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    return num.toString();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] glass">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="relative p-6">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full glass hover:bg-white/20" onClick={() => setSettingsOpen(true)}>
              <DotsThree weight="thin" className="h-5 w-5" />
            </Button>
          </div>
            <div className="flex flex-col items-center text-center pt-2">
              {isLoading ? <Skeleton className="h-[84px] w-[84px] rounded-full" /> : (
                <button onClick={() => setAchievementsOpen(true)} className="relative group">
                  <Avatar className="relative h-[84px] w-[84px] ring-2 ring-[hsl(var(--neon-purple))] ring-offset-2 ring-offset-background">
                    <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-muted text-xl text-foreground font-semibold">{profile?.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  {badgeData && badgeData.level > 0 && <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-[hsl(var(--neon-purple)/0.5)] bg-background text-[10px] font-bold text-muted-foreground">{badgeData.level}</div>}
                </button>
              )}
              {isLoading ? <Skeleton className="mt-3 h-5 w-32" /> : (
                <div className="mt-3"><span className="text-sm text-muted-foreground">@{profile?.username}</span></div>
              )}
              {!isLoading && badgeData && ((profile as any)?.show_badge_in_bio || (profile as any)?.show_sc_in_bio) && (
                <button onClick={() => setAchievementsOpen(true)} className="mt-1.5 flex items-center gap-1.5">
                  {(profile as any)?.show_badge_in_bio && (
                    <span className="text-xs font-medium text-muted-foreground">{badgeData.name}</span>
                  )}
                  {(profile as any)?.show_badge_in_bio && (profile as any)?.show_sc_in_bio && (
                    <span className="text-muted-foreground text-xs">·</span>
                  )}
                  {(profile as any)?.show_sc_in_bio && (
                    <div className="flex items-center gap-0.5">
                      <Cloud weight="thin" className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-xs text-foreground">{formatNumber(profile?.social_cloud_points || 0)} SC</span>
                    </div>
                  )}
                </button>
              )}
              {!isLoading && profile?.bio && <p className="mt-2 text-xs text-muted-foreground max-w-xs">{profile.bio}</p>}
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                <span className="text-foreground font-semibold">{postsCount}</span><span className="text-muted-foreground">Posts</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground font-semibold">{formatNumber(0)}</span><span className="text-muted-foreground">Events</span>
                <span className="text-muted-foreground">·</span>
                <button onClick={() => { setFollowListTab('followers'); setFollowListOpen(true); }} className="flex items-center gap-1">
                  <span className="text-foreground font-semibold">{formatNumber(followersCount)}</span><span className="text-muted-foreground">Follower</span>
                </button>
              </div>
            </div>
        </div>
      </div>
      <ProfileSettings open={settingsOpen} onOpenChange={setSettingsOpen} profile={profile} />
      <AchievementsView open={achievementsOpen} onOpenChange={setAchievementsOpen} badgeData={badgeData || null} city={profile?.city} />
      <FollowListDialog open={followListOpen} onOpenChange={setFollowListOpen} profileId={profile?.id} defaultTab={followListTab} followersCount={followersCount} followingCount={followingCount} />
    </>
  );
};
