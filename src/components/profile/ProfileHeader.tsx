import { useState } from 'react';
import { MoreHorizontal, Cloud } from 'lucide-react';
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

export const ProfileHeader = ({
  profile,
  isLoading,
  followersCount,
  followingCount,
  postsCount,
}: ProfileHeaderProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const { data: badgeData } = useBadgeSystem(profile?.id);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  return (
    <>
      {/* Full-Width Hero Card */}
      <div className="relative overflow-hidden rounded-[32px] glass">
        {/* Blurred Gradient Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="relative p-6">
          {/* Top Right Settings */}
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full glass hover:bg-white/20"
              onClick={() => setSettingsOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Center Content */}
          <div className="flex flex-col items-center text-center pt-4">
            {/* Avatar with Glow */}
            {isLoading ? (
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
            ) : (
              <button
                onClick={() => setAchievementsOpen(true)}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-neon opacity-60 blur-xl group-hover:opacity-80 transition-opacity" />
                <Avatar className="relative h-[140px] w-[140px] ring-4 ring-white/20 neon-glow pulse-neon">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-gradient-neon text-4xl text-white font-bold">
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {/* Badge Overlay */}
                {badgeData && (
                  <div className="absolute -bottom-1 -right-1 text-3xl badge-pulse drop-shadow-lg">
                    {badgeData.emoji}
                  </div>
                )}
              </button>
            )}

            {/* Username */}
            {isLoading ? (
              <Skeleton className="mt-4 h-6 w-40" />
            ) : (
              <div className="mt-4">
                <span className="text-lg text-muted-foreground">@{profile?.username}</span>
              </div>
            )}

            {/* Badge & SC Display */}
            {!isLoading && badgeData && (
              <button
                onClick={() => setAchievementsOpen(true)}
                className="mt-2 flex items-center gap-2"
              >
                <span className="text-2xl">{badgeData.emoji}</span>
                <span className={cn('text-xl font-bold gradient-text')}>
                  {badgeData.name}
                </span>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1">
                  <Cloud className="h-4 w-4 text-primary animate-pulse" />
                  <span className="font-semibold text-foreground">
                    {formatNumber(profile?.social_cloud_points || 0)} SC
                  </span>
                </div>
              </button>
            )}

            {/* Bio */}
            {!isLoading && profile?.bio && (
              <p className="mt-3 text-sm gradient-text font-medium max-w-xs">
                {profile.bio}
              </p>
            )}

            {/* Stats Chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <StatChip label="Posts" value={postsCount} isLoading={isLoading} />
              <StatChip label="Events" value={0} icon="🎉" isLoading={isLoading} />
              <StatChip 
                label="" 
                value={followersCount} 
                icon="👥" 
                isLoading={isLoading} 
                onClick={() => {
                  setFollowListTab('followers');
                  setFollowListOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ProfileSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
        profile={profile}
      />

      <AchievementsView
        open={achievementsOpen}
        onOpenChange={setAchievementsOpen}
        badgeData={badgeData || null}
        city={profile?.city}
      />

      <FollowListDialog
        open={followListOpen}
        onOpenChange={setFollowListOpen}
        profileId={profile?.id}
        defaultTab={followListTab}
        followersCount={followersCount}
        followingCount={followingCount}
      />
    </>
  );
};

interface StatChipProps {
  label: string;
  value: number;
  icon?: string;
  isLoading: boolean;
  onClick?: () => void;
}

const StatChip = ({ label, value, icon, isLoading, onClick }: StatChipProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  const ChipContent = (
    <>
      {icon && <span>{icon}</span>}
      <span className="font-bold text-foreground">{formatNumber(value)}</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="stat-chip neon-glow-sm hover:bg-white/20 transition-colors cursor-pointer"
      >
        {isLoading ? <Skeleton className="h-4 w-12" /> : ChipContent}
      </button>
    );
  }

  return (
    <div className="stat-chip neon-glow-sm">
      {isLoading ? <Skeleton className="h-4 w-12" /> : ChipContent}
    </div>
  );
};
