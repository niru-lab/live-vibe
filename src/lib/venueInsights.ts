import type { VenueOverview } from '@/hooks/useVenueIntelligence';

export interface VenueInsight {
  id: string;
  text: string;
  cta: string;
  /** Route to navigate to when the CTA is used. */
  to: string;
}

/**
 * One honest next action derived from measured values only.
 * Every rule requires the metrics it reasons about to actually exist.
 */
export const resolveVenueInsight = (
  o: VenueOverview | undefined,
  topEventId: string | undefined,
): VenueInsight | null => {
  if (!o) return null;
  const rsvp = o.going + o.interested;

  if (o.total_events === 0) {
    return { id: 'no_events', text: 'Noch kein Event angelegt. Gäste finden dich über Events.', cta: 'Event erstellen', to: '/events/create?first=1' };
  }
  if (o.upcoming_events === 0) {
    return { id: 'no_upcoming', text: 'Kein kommendes Event. Plane das nächste, solange Gäste dich noch auf dem Schirm haben.', cta: 'Event erstellen', to: '/events/create' };
  }
  if (o.event_views < 10) {
    return { id: 'low_views', text: 'Wenig Event-Aufrufe. Teile dein Event, damit es Reichweite bekommt.', cta: 'Event teilen', to: topEventId ? `/events/${topEventId}` : '/events' };
  }
  if (o.event_views >= 10 && rsvp === 0) {
    return { id: 'views_no_rsvp', text: 'Dein Event wird geöffnet, aber niemand sagt zu. Prüfe Titel, Zeit, Preis und Beschreibung.', cta: 'Event-Details prüfen', to: topEventId ? `/events/${topEventId}` : '/events' };
  }
  if (rsvp >= 5 && o.linked_posts === 0) {
    return { id: 'rsvp_no_content', text: 'Gute Zusagen, aber keine Posts zu deinem Event. Lade Gäste zum Posten ein.', cta: 'Event ansehen', to: topEventId ? `/events/${topEventId}` : '/events' };
  }
  if (o.offer_impressions >= 20 && o.offer_activations === 0) {
    return { id: 'offer_no_activation', text: 'Dein Angebot wird gesehen, aber nicht aktiviert. Prüfe Angebotstext und Bedingungen.', cta: 'Angebote prüfen', to: '/venue' };
  }
  if (o.linked_posts >= 3) {
    return { id: 'strong_content', text: 'Gäste posten zu deinem Spot. Plane ein ähnliches Event, solange der Schwung da ist.', cta: 'Event erstellen', to: '/events/create' };
  }
  return null;
};
