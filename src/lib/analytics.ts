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
  | 'rsvp_error'
  | 'venue_marker_opened'
  | 'venue_active_event_viewed'
  | 'venue_live_posts_viewed'
  | 'venue_profile_opened_from_map'
  | 'event_detail_opened_from_map'
  | 'offer_impression'
  | 'offer_opened'
  | 'offer_activated'
  | 'offer_shared'
  | 'offer_expired'
  | 'event_social_proof_viewed'
  | 'event_friend_signal_viewed'
  | 'event_rsvp_cta_clicked'
  | 'event_post_cta_clicked'
  | 'event_linked_post_created'
  | 'venue_follow_from_event'
  | 'social_cloud_action_awarded'
  | 'social_cloud_nudge_shown'
  | 'social_cloud_nudge_completed';

export type RsvpSurface = 'feed' | 'map' | 'discovery' | 'event_detail' | 'events' | 'venue_sheet' | 'venue_profile' | 'venue_dashboard';

export interface AnalyticsProps {
  eventId?: string;
  venueId?: string;
  offerId?: string;
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
