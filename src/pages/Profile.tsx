import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useFollowStats, usePostsCount } from '@/hooks/useFollowStats';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { Users } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: followStats } = useFollowStats(profile?.id);
  const { data: postsCount } = usePostsCount(profile?.id);

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Nicht angemeldet
          </h2>
          <p className="mb-6 max-w-xs text-muted-foreground">
            Melde dich an, um dein Profil zu sehen und Events zu erstellen.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-primary to-accent"
          >
            Anmelden
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isLoading = authLoading || profileLoading;

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold">Profil</h1>
      </header>

      <div className="p-4">
        {/* Profile Header with Stats */}
        <ProfileHeader
          profile={profile || null}
          isLoading={isLoading}
          followersCount={followStats?.followers || 0}
          followingCount={followStats?.following || 0}
          postsCount={postsCount || 0}
        />

        {/* Posts Grid */}
        <ProfilePostsGrid profileId={profile?.id} />
      </div>
    </AppLayout>
  );
}
