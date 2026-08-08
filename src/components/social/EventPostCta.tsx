import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { track, type RsvpSurface } from '@/lib/analytics';
import { Camera, X } from '@phosphor-icons/react';

const SESSION_KEY = 'feyrn:post-cta-shown';

/** One contextual post CTA per session, unless the user completed the action. */
const alreadyShownThisSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

const markShown = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage disabled — degrade to always showing */
  }
};

interface EventPostCtaProps {
  eventId?: string | null;
  venueId?: string | null;
  eventName?: string | null;
  surface: RsvpSurface;
  /** Only render once the user did something meaningful (RSVP, opened live posts, …). */
  active: boolean;
}

/**
 * Non-blocking "post your vibe" CTA that opens the existing composer with the
 * event/venue relation preselected. Never a popup, never twice per session.
 */
export const EventPostCta = ({ eventId, venueId, eventName, surface, active }: EventPostCtaProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [allowed] = useState(() => !alreadyShownThisSession());

  const visible = active && allowed && !dismissed && (!!eventId || !!venueId);

  useEffect(() => {
    if (!visible) return;
    markShown();
    track('social_cloud_nudge_shown', { eventId: eventId ?? undefined, venueId: venueId ?? undefined, surface });
  }, [visible, eventId, venueId, surface]);

  if (!visible) return null;

  const openComposer = () => {
    track('event_post_cta_clicked', { eventId: eventId ?? undefined, venueId: venueId ?? undefined, surface });
    const params = new URLSearchParams();
    if (eventId) params.set('eventId', eventId);
    if (venueId) params.set('venueId', venueId);
    navigate(`/create?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4" data-testid="event-post-cta">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Zeig deinen Vibe</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {eventName ? `Post zu „${eventName}" erstellen` : 'Teile deinen Moment von diesem Spot'} · +25 Social Cloud
          </p>
        </div>
        <button
          aria-label="Hinweis ausblenden"
          onClick={() => setDismissed(true)}
          className="min-h-[32px] text-muted-foreground"
        >
          <X weight="thin" className="h-4 w-4" />
        </button>
      </div>
      <Button className="mt-3 min-h-[44px] w-full gap-2" onClick={openComposer}>
        <Camera weight="thin" className="h-4 w-4" /> Post erstellen
      </Button>
    </div>
  );
};
