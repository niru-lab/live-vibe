import { Button } from '@/components/ui/button';
import { UserCheck, Heart } from '@phosphor-icons/react';
import { useMyRsvpMap, useRSVP, useRsvpCounts } from '@/hooks/useEventAttendees';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/** Compact RSVP control used inside map popups — shares state with feed & detail. */
export const MapEventRsvp = ({ eventId }: { eventId: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: myRsvps } = useMyRsvpMap();
  const { data: counts } = useRsvpCounts([eventId]);
  const rsvp = useRSVP();

  const status = myRsvps?.[eventId] ?? null;
  const going = counts?.[eventId]?.going ?? 0;
  const interested = counts?.[eventId]?.interested ?? 0;

  const set = async (next: 'going' | 'interested') => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    try {
      await rsvp.mutateAsync({ eventId, status: status === next ? null : next, surface: 'map' });
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Status konnte nicht gespeichert werden.' });
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] text-muted-foreground">
        {going} zugesagt{interested > 0 ? ` · ${interested} interessiert` : ''}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          variant={status === 'going' ? 'outline' : 'default'}
          aria-pressed={status === 'going'}
          aria-label={status === 'going' ? 'Zusage zurückziehen' : 'Zusagen'}
          disabled={rsvp.isPending}
          className="h-9 gap-1 text-[11px]"
          onClick={() => set('going')}
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
          className={`h-9 gap-1 text-[11px] ${status === 'interested' ? 'border-primary text-primary' : ''}`}
          onClick={() => set('interested')}
        >
          <Heart weight={status === 'interested' ? 'fill' : 'thin'} className="h-3.5 w-3.5" />
          {status === 'interested' ? 'Gemerkt ✓' : 'Interessiert'}
        </Button>
      </div>
    </div>
  );
};
