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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-hero">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full glass neon-glow">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mb-3 text-2xl font-bold gradient-text">
            Nicht angemeldet
          </h2>
          <p className="mb-8 max-w-xs text-muted-foreground">
            Melde dich an, um dein Profil zu sehen und Events zu erstellen.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-gradient-neon hover:opacity-90 text-white font-semibold px-8 py-6 rounded-2xl neon-glow"
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
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-hero -z-10" />
      
      <div className="min-h-screen">
        {/* Minimal Header */}
        <header className="flex items-center justify-center py-4">
          <span className="text-2xl">👤</span>
        </header>

        <div className="px-4 pb-24">
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
      </div>
    </AppLayout>
  );
}
