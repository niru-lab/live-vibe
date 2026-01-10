import { useState } from 'react';
import { Settings, Cloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileSettings } from './ProfileSettings';
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
                <Avatar className="h-[100px] w-[100px] ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-3xl text-primary-foreground">
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
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
                    <p className="text-sm text-muted-foreground">@{profile?.username}</p>
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

          {/* Bio / Status with Social Cloud */}
          {!isLoading && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {profile?.bio || 'Noch keine Bio'}
                {profile?.city && ` 📍 ${profile.city}`}
              </p>
              
              {/* Social Cloud Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-1">
                <Cloud className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-foreground">
                  {profile?.social_cloud_points || 0}
                </span>
                <span className="text-xs text-muted-foreground">Social Cloud</span>
              </div>
            </div>
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
      <span className="text-lg font-bold text-foreground">{value}</span>
    )}
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
