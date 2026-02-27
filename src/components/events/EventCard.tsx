import { CalendarBlank, MapPin, Users, Clock, UserCheck, Flame } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEventAttendees, useFriendsAttending, useUserEventRSVP, useRSVP } from '@/hooks/useEventAttendees';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BadgeDisplay } from '@/components/profile/BadgeDisplay';
import type { EventWithCreator } from '@/hooks/useEvents';

const categoryEmojis: Record<string, string> = { club: '🎧', house_party: '🏠', bar: '🍸', festival: '🎪', concert: '🎤', other: '✨' };

interface EventCardProps { event: EventWithCreator; onClick: () => void; compact?: boolean; }

export const EventCard = ({ event, onClick, compact = false }: EventCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startsAt = new Date(event.starts_at);
  const isToday = new Date().toDateString() === startsAt.toDateString();
  const isSoon = startsAt.getTime() - Date.now() < 3 * 60 * 60 * 1000;
  const { data: attendees } = useEventAttendees(event.id);
  const { data: friendsAttending } = useFriendsAttending(event.id);
  const { data: userRSVP } = useUserEventRSVP(event.id);
  const rsvpMutation = useRSVP();
  const goingCount = attendees?.goingCount || 0;
  const expectedAttendees = event.expected_attendees || 100;
  const fillPercentage = Math.min((goingCount / expectedAttendees) * 100, 100);
  const isGoing = userRSVP?.status === 'going';

  const handleRSVP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    await rsvpMutation.mutateAsync({ eventId: event.id, status: isGoing ? null : 'going' });
  };

  return (
    <article onClick={onClick} className="group animate-fade-in cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-glow">
      <div className="relative aspect-[16/9] bg-muted">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-5xl">{categoryEmojis[event.category] || '🎉'}</span>
          </div>
        )}
        {isSoon && <div className="absolute left-3 top-3"><Badge className="bg-accent/90 backdrop-blur"><span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />{isToday ? 'Heute' : 'Bald'}</Badge></div>}
        <div className="absolute right-3 top-3"><Badge variant="secondary" className="bg-background/80 backdrop-blur">{event.is_free ? 'Kostenlos' : `${event.entry_price}€`}</Badge></div>
        <div className="absolute bottom-3 left-3"><Badge variant="outline" className="border-white/30 bg-background/60 backdrop-blur">{categoryEmojis[event.category]} {event.category.replace('_', ' ')}</Badge></div>
        {isGoing && <div className="absolute bottom-3 right-3"><Badge className="bg-green-500/90 backdrop-blur"><UserCheck weight="thin" className="mr-1 h-3 w-3" />Du gehst hin</Badge></div>}
      </div>
      <div className="p-4">
        <h3 className="mb-2 font-display text-lg font-bold text-foreground line-clamp-1">{event.name}</h3>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{goingCount}/{expectedAttendees} zugesagt</span>
              {fillPercentage > 70 && <Flame weight="thin" className="h-4 w-4 text-orange-500" />}
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(fillPercentage)}%</span>
          </div>
          <Progress value={fillPercentage} className="h-1.5" />
        </div>
        {friendsAttending && friendsAttending.length > 0 && (
          <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-muted/50">
            <div className="flex -space-x-2">
              {friendsAttending.slice(0, 3).map((friend) => (
                <Avatar key={friend.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={friend.profile?.avatar_url || ''} /><AvatarFallback className="text-xs">{friend.profile?.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{friendsAttending.length} Freunde gehen</span>
          </div>
        )}
        <div className="mb-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><CalendarBlank weight="thin" className="h-4 w-4" /><span>{format(startsAt, 'EEEE, d. MMM', { locale: de })}</span></div>
          <div className="flex items-center gap-2"><Clock weight="thin" className="h-4 w-4" /><span>{format(startsAt, 'HH:mm', { locale: de })} Uhr</span></div>
          <div className="flex items-center gap-2"><MapPin weight="thin" className="h-4 w-4" /><span className="line-clamp-1">{event.location_name}, {event.city}</span></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRSVP} variant={isGoing ? 'outline' : 'default'} size="sm"
            className={cn('flex-1 gap-1.5', isGoing ? 'border-green-500 text-green-500 hover:bg-green-500/10' : '')}
            disabled={rsvpMutation.isPending}>
            <UserCheck weight="thin" className="h-4 w-4" />{isGoing ? 'Zugesagt ✓' : 'Zusagen'}
          </Button>
        </div>
        {event.creator && (
          <div className="flex items-center gap-2 border-t border-border/50 pt-3 mt-3">
            <Avatar className="h-6 w-6"><AvatarImage src={event.creator.avatar_url || ''} /><AvatarFallback className="text-xs">{event.creator.display_name?.charAt(0)}</AvatarFallback></Avatar>
            <span className="text-xs text-muted-foreground">von <span className="font-medium text-foreground">@{event.creator.username}</span></span>
            {event.creator.social_cloud_points !== undefined && <BadgeDisplay points={event.creator.social_cloud_points} size="sm" />}
          </div>
        )}
      </div>
    </article>
  );
};
