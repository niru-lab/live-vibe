import { Button } from '@/components/ui/button';
import { UserCheck, Heart } from '@phosphor-icons/react';
import { useMyRsvpMap, useRSVP, useRsvpCounts } from '@/hooks/useEventAttendees';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { RsvpSurface } from '@/lib/analytics';

interface RsvpButtonsProps {
  eventId: string;
  surface: RsvpSurface;
  /** Provide batched counts from a list parent to avoid per-card queries. */
  counts?: { going: number; interested: number };
  showCounts?: boolean;
  compact?: boolean;
}

/**
 * Single RSVP control shared by feed, list, map and detail surfaces so
 * status and counts stay consistent everywhere.
 */
export const RsvpButtons = ({ eventId, surface, counts, showCounts = true, compact = false }: RsvpButtonsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: myRsvps } = useMyRsvpMap();
  const { data: fallbackCounts } = useRsvpCounts(counts ? [] : [eventId]);
  const rsvp = useRSVP();

  const status = myRsvps?.[eventId] ?? null;
  const resolved = counts ?? fallbackCounts?.[eventId] ?? { going: 0, interested: 0 };

  const set = async (e: React.MouseEvent, next: 'going' | 'interested') => {
    e.stopPropagation();
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    try {
      await rsvp.mutateAsync({ eventId, status: status === next ? null : next, surface });
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Status konnte nicht gespeichert werden.' });
    }
  };

  const height = compact ? 'h-9' : 'min-h-[44px]';

  return (
    <div className="space-y-1.5">
      {showCounts && (
        <p className="text-[11px] text-muted-foreground">
          {resolved.going} zugesagt{resolved.interested > 0 ? ` · ${resolved.interested} interessiert` : ''}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          variant={status === 'going' ? 'outline' : 'default'}
          aria-pressed={status === 'going'}
          aria-label={status === 'going' ? 'Zusage zurückziehen' : 'Zusagen'}
          disabled={rsvp.isPending}
          className={`${height} gap-1 text-xs ${status === 'going' ? 'border-green-500 text-green-500' : ''}`}
          onClick={(e) => set(e, 'going')}
        >
          <UserCheck weight="thin" className="h-3.5 w-3.5" />
          {status === 'going' ? 'Zugesagt ✓' : 'Zusagen'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-pressed={status === 'interested'}
          aria-label={status === 'interested' ? 'Nicht mehr interessiert' : 'Interessiert'}
          disabled={rsvp.isPending}
          className={`${height} gap-1 text-xs ${status === 'interested' ? 'border-primary text-primary' : ''}`}
          onClick={(e) => set(e, 'interested')}
        >
          <Heart weight={status === 'interested' ? 'fill' : 'thin'} className="h-3.5 w-3.5" />
          {status === 'interested' ? 'Gemerkt ✓' : 'Interessiert'}
        </Button>
      </div>
    </div>
  );
};
