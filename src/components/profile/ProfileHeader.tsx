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
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-card card-glow">
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%)' }} />
        <div className="relative p-6">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full glass-pill" onClick={() => setSettingsOpen(true)}>
              <DotsThree weight="bold" className="h-5 w-5 text-foreground" />
            </Button>
          </div>
            <div className="flex flex-col items-center text-center pt-2">
              {isLoading ? <Skeleton className="h-[90px] w-[90px] rounded-full" /> : (
                <button onClick={() => setAchievementsOpen(true)} className="relative group">
                  <div className="avatar-gradient-ring">
                    <Avatar className="relative h-[84px] w-[84px] border-2 border-card">
                      <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-muted text-xl text-foreground font-bold">{profile?.display_name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </div>
                  {badgeData && badgeData.level > 0 && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full glass-pill px-1.5 text-[10px] font-bold text-foreground shadow-lg">
                      {badgeData.level}
                    </div>
                  )}
                </button>
              )}
              {isLoading ? <Skeleton className="mt-3 h-5 w-32" /> : (
                <div className="mt-3"><span className="text-sm font-medium text-muted-foreground">@{profile?.username}</span></div>
              )}
              {!isLoading && badgeData && (profile?.show_badge_in_bio || profile?.show_sc_in_bio) && (
                <button onClick={() => setAchievementsOpen(true)} className="mt-2 flex items-center gap-2 rounded-full glass-pill px-3 py-1.5">
                  {profile?.show_badge_in_bio && (
                    <span className="text-[11px] font-semibold text-foreground tracking-wide">{badgeData.name}</span>
                  )}
                  {profile?.show_badge_in_bio && profile?.show_sc_in_bio && (
                    <span className="text-muted-foreground/60 text-[10px]">·</span>
                  )}
                  {profile?.show_sc_in_bio && (
                    <div className="flex items-center gap-1">
                      <Cloud weight="fill" className="h-3 w-3 text-primary" />
                      <span className="font-semibold text-[11px] text-foreground">{formatNumber(profile?.social_cloud_points || 0)} SC</span>
                    </div>
                  )}
                </button>
              )}
              {!isLoading && profile?.bio && <p className="mt-3 text-xs max-w-xs leading-relaxed text-muted-foreground">{profile.bio}</p>}
              <div className="mt-5 grid grid-cols-3 w-full max-w-[280px]">
                <div className="flex flex-col items-center px-2">
                  <span className="text-foreground font-bold text-[24px] leading-tight">{postsCount}</span>
                  <span className="text-[12px] mt-0.5 text-muted-foreground">Posts</span>
                </div>
                <div className="flex flex-col items-center px-2 border-x border-border">
                  <span className="text-foreground font-bold text-[24px] leading-tight">{formatNumber(0)}</span>
                  <span className="text-[12px] mt-0.5 text-muted-foreground">Events</span>
                </div>
                <button onClick={() => { setFollowListTab('followers'); setFollowListOpen(true); }} className="flex flex-col items-center px-2 transition-opacity hover:opacity-80">
                  <span className="text-foreground font-bold text-[24px] leading-tight">{formatNumber(followersCount)}</span>
                  <span className="text-[12px] mt-0.5 text-muted-foreground">Followers</span>
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
