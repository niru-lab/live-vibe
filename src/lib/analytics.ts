/**
 * Minimal, privacy-safe analytics facade.
 * Only ids / enums are ever passed — never content, emails, coordinates or
 * profile preferences.
 *
 * Events listed in PERSISTED are additionally written to `analytics_events`
 * so venue owners can see real, measured numbers in their dashboard. The row
 * contains no user identity — only the entity ids and the surface.
 */

import { supabase } from '@/integrations/supabase/client';

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
  | 'venue_profile_viewed'
  | 'venue_profile_opened_from_map'
  | 'event_detail_opened_from_map'
  | 'share_clicked'
  | 'post_viewed'
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
  | 'venue_followed'
  | 'social_cloud_action_awarded'
  | 'social_cloud_nudge_shown'
  | 'social_cloud_nudge_completed'
  | 'venue_dashboard_opened'
  | 'venue_analytics_range_changed'
  | 'venue_event_performance_opened'
  | 'venue_content_performance_opened'
  | 'venue_insight_clicked'
  | 'venue_event_shared_from_dashboard'
  | 'venue_create_event_clicked_from_dashboard';

export type RsvpSurface = 'feed' | 'map' | 'discovery' | 'event_detail' | 'events' | 'venue_sheet' | 'venue_profile' | 'venue_dashboard';

export interface AnalyticsProps {
  eventId?: string;
  venueId?: string;
  offerId?: string;
  postId?: string;
  eventType?: string | null;
  role?: string | null;
  status?: string | null;
  previousStatus?: string | null;
  surface?: RsvpSurface;
  count?: number;
  reason?: string;
  range?: string;
}

/** Events that produce venue-visible metrics and are therefore persisted. */
const PERSISTED = new Set<AnalyticsEvent>([
  'event_detail_viewed',
  'event_marker_opened',
  'venue_marker_opened',
  'venue_profile_viewed',
  'venue_profile_opened_from_map',
  'event_detail_opened_from_map',
  'share_clicked',
  'post_viewed',
  'offer_impression',
  'offer_opened',
  'offer_activated',
  'offer_shared',
]);

export const track = (event: AnalyticsEvent, props: AnalyticsProps = {}) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, props);
  }

  if (!PERSISTED.has(event)) return;
  if (!props.eventId && !props.venueId && !props.postId) return;

  // Fire and forget — analytics must never block or break a user flow.
  void supabase
    .from('analytics_events')
    .insert({
      event_name: event,
      event_id: props.eventId ?? null,
      venue_id: props.venueId ?? null,
      post_id: props.postId ?? null,
      offer_id: props.offerId ?? null,
      surface: props.surface ?? null,
    })
    .then(undefined, () => undefined);
};
