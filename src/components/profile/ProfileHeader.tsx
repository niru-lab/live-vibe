import { useState } from 'react';
import { Settings, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ProfileSettings } from './ProfileSettings';
import { AchievementsView } from './AchievementsView';
import { BadgeOverlay } from './BadgeDisplay';
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
  const { data: badgeData } = useBadgeSystem(profile?.id);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
        {/* Background gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />

        <div className="relative p-4 pt-6">
          {/* Top row: Avatar, Username, Settings */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="h-[100px] w-[100px] rounded-full" />
              ) : (
                <div className="relative">
                  <Avatar className="h-[100px] w-[100px] ring-4 ring-background shadow-xl">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-3xl text-primary-foreground">
                      {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Badge overlay */}
                  {badgeData && (
                    <BadgeOverlay points={profile?.social_cloud_points || 0} className="h-8 w-8 text-lg" />
                  )}
                </div>
              )}

              <div className="flex flex-col">
                {isLoading ? (
                  <>
                    <Skeleton className="mb-2 h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        {profile?.display_name}
                      </h2>
                      {profile?.is_verified && (
                        <Badge className="h-5 bg-primary px-1.5 text-primary-foreground">✓</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">@{profile?.username}</span>
                      {badgeData && (
                        <span className={cn('text-sm font-semibold', badgeData.color)}>
                          {badgeData.emoji}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Badge Display - Only Badge and Name */}
          {!isLoading && badgeData && (
            <button
              onClick={() => setAchievementsOpen(true)}
              className="mt-4 w-full rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-card p-3 text-left transition-all hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{badgeData.emoji}</span>
                  <div>
                    <p className={cn('font-bold', badgeData.color)}>
                      {badgeData.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.bio || 'Noch keine Bio'}
                    </p>
                  </div>
                </div>
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          )}

          {/* Stats Row: Followers | Following | Posts */}
          <div className="mt-4 flex items-center justify-center divide-x divide-border">
            <StatItem label="Follower" value={followersCount} isLoading={isLoading} />
            <StatItem label="Following" value={followingCount} isLoading={isLoading} />
            <StatItem label="Beiträge" value={postsCount} isLoading={isLoading} />
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
    </>
  );
};

interface StatItemProps {
  label: string;
  value: number;
  isLoading: boolean;
}

const StatItem = ({ label, value, isLoading }: StatItemProps) => (
  <div className="flex flex-col items-center px-6 py-2">
    {isLoading ? (
      <Skeleton className="h-6 w-10" />
    ) : (
      <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
    )}
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
