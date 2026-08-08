import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RsvpButtons } from '@/components/events/RsvpButtons';
import type { VenueEvent, VenueEventStatus } from '@/hooks/useVenueSheet';
import type { RsvpSurface } from '@/lib/analytics';

const statusStyles: Record<VenueEventStatus, { label: string; className: string }> = {
  live: { label: 'LIVE', className: 'bg-red-500 text-white animate-pulse' },
  today: { label: 'Heute', className: 'bg-primary text-primary-foreground' },
  upcoming: { label: 'Bald', className: 'bg-muted text-muted-foreground' },
};

interface VenueEventCardProps {
  event: VenueEvent;
  surface: RsvpSurface;
  counts?: { going: number; interested: number };
  variant?: 'primary' | 'compact';
  selected?: boolean;
  onSelect?: () => void;
  onOpenDetail: () => void;
}

/** Single event card. RSVP state is scoped per event id, never shared. */
export const VenueEventCard = ({
  event,
  surface,
  counts,
  variant = 'primary',
  selected,
  onSelect,
  onOpenDetail,
}: VenueEventCardProps) => {
  const status = statusStyles[event.status];

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-xl border p-3 transition-colors ${
          selected ? 'border-primary/70 bg-primary/5' : 'border-border/60'
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Event ${event.name} auswählen`}
          className="flex w-full items-start gap-3 text-left"
        >
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.name}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                {status.label}
              </span>
              <span className="truncate text-sm font-medium text-foreground">{event.name}</span>
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {format(new Date(event.starts_at), 'EEE, dd. MMM · HH:mm', { locale: de })} Uhr
            </span>
          </span>
        </button>
        <div className="mt-2 flex items-center gap-2">
          <RsvpButtons eventId={event.id} surface={surface} counts={counts} compact />
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto min-h-[44px] gap-1 text-xs"
            onClick={onOpenDetail}
            aria-label={`Event ${event.name} öffnen`}
          >
            Öffnen <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {event.cover_image_url && (
        <img
          src={event.cover_image_url}
          alt={event.name}
          loading="lazy"
          className="h-36 w-full rounded-xl object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span>
        <h3 className="text-sm font-semibold text-foreground">{event.name}</h3>
      </div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {format(new Date(event.starts_at), 'EEE, dd. MMM · HH:mm', { locale: de })} Uhr
      </p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {event.location_name}
        {event.city ? `, ${event.city}` : ''}
      </p>
      <RsvpButtons eventId={event.id} surface={surface} counts={counts} />
      <Button variant="outline" className="min-h-[44px] w-full gap-1" onClick={onOpenDetail}>
        Event Details <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
