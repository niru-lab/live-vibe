/**
 * Minimal, privacy-safe analytics facade.
 * Only ids / enums are ever passed — never content, emails, coordinates or
 * profile preferences. Swap the sink here when a real provider is added.
 */

export type AnalyticsEvent =
  | 'event_map_viewed'
  | 'event_marker_opened'
  | 'event_detail_viewed'
  | 'rsvp_cta_clicked'
  | 'rsvp_status_set'
  | 'rsvp_status_changed'
  | 'rsvp_removed'
  | 'rsvp_error';

export type RsvpSurface = 'feed' | 'map' | 'discovery' | 'event_detail' | 'events';

export interface AnalyticsProps {
  eventId?: string;
  eventType?: string | null;
  role?: string | null;
  status?: string | null;
  previousStatus?: string | null;
  surface?: RsvpSurface;
  count?: number;
  reason?: string;
}

export const track = (event: AnalyticsEvent, props: AnalyticsProps = {}) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, props);
  }
};
