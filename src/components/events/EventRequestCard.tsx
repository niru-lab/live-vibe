import { useQuery } from '@tanstack/react-query';
import { CaretRight, Clock, EnvelopeSimple, Hourglass, MapPin, Users } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { usePublicProfiles } from '@/hooks/useProfile';
import { eventDistanceLabel, eventTimeLabel } from '@/lib/eventCard';
import { cn } from '@/lib/utils';
import { EventCover, type EventCardData } from './EventHeroCard';

/** Up to 4 faces of attendees who opted in to being shown (event_visible_attendees, max 8), plus "+N" from the total. */
const AttendeeStack = ({ eventId, total }: { eventId: string; total: number }) => {
  const { data: ids = [] } = useQuery({
    queryKey: ['visible-attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_visible_attendees', { _event_id: eventId });
      if (error) throw error;
      return (data ?? []) as string[];
    },
    staleTime: 60_000,
  });
  const shown = ids.slice(0, 4);
  const { data: profiles } = usePublicProfiles(shown);
  const rest = Math.max(total - shown.length, 0);
  if (shown.length === 0 && rest === 0) return null;
  return (
    <div className="mt-2 flex items-center -space-x-2">
      {shown.map((id) => {
        const p = profiles?.[id];
        return (
          <Avatar key={id} className="h-7 w-7 border-2 border-card">
            <AvatarImage src={p?.avatar_url || ''} />
            <AvatarFallback className="text-[10px]">{p?.display_name?.charAt(0) ?? '·'}</AvatarFallback>
          </Avatar>
        );
      })}
      {rest > 0 && (
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-card bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
};

export type RequestStatus = 'requested' | 'invited';

interface EventRequestCardProps {
  event: EventCardData;
  status: RequestStatus;
  going?: number;
  myPosition?: { lat: number; lng: number } | null;
  /** Extra actions below the card (accept/decline an invitation, withdraw a request). */
  footer?: React.ReactNode;
}

/** "Angefragt" card: photo left with crowd badge, details right, status pill, one chevron. */
export const EventRequestCard = ({ event, status, going = 0, myPosition, footer }: EventRequestCardProps) => {
  const navigate = useNavigate();
  const distance = eventDistanceLabel(event, myPosition);
  const place = event.location_name || event.city || 'Unbekannt';

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm" data-testid="event-request-card">
      <button
        type="button"
        onClick={() => navigate(`/events/${event.id}`)}
        className="flex w-full items-stretch gap-3 p-2.5 pr-2 text-left"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          <EventCover event={event} />
          {going > 0 && (
            <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
              <Users weight="bold" className="h-3 w-3" /> {going}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 text-[15px] font-bold leading-snug text-foreground">{event.name}</h3>
            <span
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                status === 'requested' ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground/80',
              )}
            >
              {status === 'requested'
                ? <><Hourglass weight="bold" className="h-3.5 w-3.5" /> Angefragt</>
                : <><EnvelopeSimple weight="bold" className="h-3.5 w-3.5" /> Einladung</>}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{place}{distance ? ` · ${distance}` : ''}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" /> {eventTimeLabel(event.starts_at)}
          </p>
          <AttendeeStack eventId={event.id} total={going} />
        </div>

        <CaretRight weight="bold" className="h-4 w-4 shrink-0 self-center text-muted-foreground" aria-hidden />
      </button>
      {footer && <div className="border-t border-border/50 px-3 py-2">{footer}</div>}
    </div>
  );
};
