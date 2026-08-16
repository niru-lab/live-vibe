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
import { ReferralProgressCard } from '@/components/referral/ReferralProgressCard';
import { Users, GearSix, ChatCircleDots, Cards as CardsIcon, ChartLine, ArrowRight } from '@phosphor-icons/react';
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full glass-pill"
              onClick={() => navigate('/cards')}
              aria-label="Feyrn Cards öffnen"
            >
              <CardsIcon weight="bold" className="h-4 w-4 text-foreground" />
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
          </div>
        </header>
        <div className="px-4 pb-24">
          <ProfileHeader profile={profile || null} isLoading={isLoading} followersCount={followStats?.followers || 0} followingCount={followStats?.following || 0} postsCount={postsCount || 0} />
          {profile && (
            <ReferralProgressCard
              profileId={profile.id}
              role={profile.role === 'venue_owner' ? 'venue_owner' : 'guest'}
            />
          )}
          {profile?.role === 'venue_owner' && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition-colors active:bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ChartLine weight="fill" className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Venue Dashboard</p>
                  <p className="text-xs text-muted-foreground">Events & Analytics</p>
                </div>
              </div>
              <ArrowRight weight="bold" className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <ProfilePostsGrid profileId={profile?.id} />

          {/* Legal Links */}
          <div className="mt-6 space-y-1">
            <button
              onClick={() => navigate('/impressum')}
              className="w-full flex items-center justify-between px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition rounded-xl hover:bg-muted/50"
            >
              Impressum
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/datenschutz')}
              className="w-full flex items-center justify-between px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition rounded-xl hover:bg-muted/50"
            >
              Datenschutz
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/agb')}
              className="w-full flex items-center justify-between px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition rounded-xl hover:bg-muted/50"
            >
              Nutzungsbedingungen
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <ProfileSettings open={settingsOpen} onOpenChange={setSettingsOpen} profile={profile || null} />
    </AppLayout>
  );
}
