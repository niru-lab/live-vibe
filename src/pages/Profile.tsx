import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings,
  LogOut,
  MapPin,
  Calendar,
  Zap,
  Users,
  Heart,
  Edit,
  Crown,
} from 'lucide-react';

const profileTypeBadges = {
  user: { label: 'Party-Löwe', icon: Zap, color: 'bg-primary' },
  club: { label: 'Club', icon: Crown, color: 'bg-secondary' },
  organizer: { label: 'Veranstalter', icon: Calendar, color: 'bg-accent' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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
  const profileBadge = profile?.profile_type ? profileTypeBadges[profile.profile_type as keyof typeof profileTypeBadges] : profileTypeBadges.user;

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold">Profil</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
          {/* Background gradient */}
          <div className="absolute inset-0 h-32 bg-gradient-to-br from-primary/30 to-accent/30" />

          <div className="relative px-4 pb-4 pt-16">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              {isLoading ? (
                <Skeleton className="h-24 w-24 rounded-full" />
              ) : (
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Name & Username */}
              <div className="mt-4 text-center">
                {isLoading ? (
                  <>
                    <Skeleton className="mx-auto mb-2 h-6 w-32" />
                    <Skeleton className="mx-auto h-4 w-24" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        {profile?.display_name || 'Unbekannt'}
                      </h2>
                      {profile?.is_verified && (
                        <Badge className="h-5 bg-secondary px-1.5">✓</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">@{profile?.username}</p>
                  </>
                )}
              </div>

              {/* Profile Type Badge */}
              {!isLoading && profile && (
                <Badge
                  className={`mt-3 gap-1.5 ${profileBadge.color}`}
                >
                  <profileBadge.icon className="h-3.5 w-3.5" />
                  {profileBadge.label}
                </Badge>
              )}

              {/* Bio */}
              {profile?.bio && (
                <p className="mt-4 max-w-xs text-center text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              {/* City */}
              {profile?.city && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.city}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard
            icon={Zap}
            label="Social Cloud"
            value={profile?.social_cloud_points || 0}
            isLoading={isLoading}
            highlight
          />
          <StatCard
            icon={Users}
            label="Follower"
            value={0}
            isLoading={isLoading}
          />
          <StatCard
            icon={Heart}
            label="Likes"
            value={0}
            isLoading={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={() => navigate('/events')}
          >
            <Calendar className="h-5 w-5 text-primary" />
            Meine Events
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  isLoading?: boolean;
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, isLoading, highlight }: StatCardProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-3 ${
        highlight
          ? 'border-primary/50 bg-primary/10'
          : 'border-border/50 bg-card'
      }`}
    >
      <Icon className={`h-5 w-5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      {isLoading ? (
        <Skeleton className="mt-1 h-6 w-12" />
      ) : (
        <span className={`mt-1 text-xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
