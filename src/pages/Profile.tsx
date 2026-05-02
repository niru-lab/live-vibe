import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useFollowStats, usePostsCount } from '@/hooks/useFollowStats';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { Users, GearSix, ChatCircleDots } from '@phosphor-icons/react';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: followStats } = useFollowStats(profile?.id);
  const { data: postsCount } = usePostsCount(profile?.id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { messagesBadge } = useNotificationBadges();

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-hero">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full glass">
            <Users weight="thin" className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mb-3 text-xl font-bold">Nicht angemeldet</h2>
          <p className="mb-8 max-w-xs text-sm text-muted-foreground">Melde dich an, um dein Profil zu sehen und Events zu erstellen.</p>
          <Button onClick={() => navigate('/auth')} variant="outline" className="px-8 py-6 rounded-2xl text-base">Anmelden</Button>
        </div>
      </AppLayout>
    );
  }

  const isLoading = authLoading || profileLoading;

  return (
    <AppLayout>
      <div className="fixed inset-0 -z-10 bg-background" />
      <div className="min-h-screen">
        <header className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full glass-pill"
            onClick={() => navigate('/messages')}
            aria-label="Nachrichten öffnen"
          >
            <ChatCircleDots weight="bold" className="h-4 w-4 text-foreground" />
            {messagesBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-primary-foreground bg-primary">
                {messagesBadge > 9 ? '9+' : messagesBadge}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full glass-pill"
            onClick={() => setSettingsOpen(true)}
            aria-label="Einstellungen öffnen"
          >
            <GearSix weight="bold" className="h-4 w-4 text-foreground" />
          </Button>
        </header>
        <div className="px-4 pb-24">
          <ProfileHeader profile={profile || null} isLoading={isLoading} followersCount={followStats?.followers || 0} followingCount={followStats?.following || 0} postsCount={postsCount || 0} />
          <ProfilePostsGrid profileId={profile?.id} />
        </div>
      </div>
      <ProfileSettings open={settingsOpen} onOpenChange={setSettingsOpen} profile={profile || null} />
    </AppLayout>
  );
}
