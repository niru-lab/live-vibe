/**
 * Central Social Cloud scoring config.
 *
 * These values MIRROR the server-side map inside `public.award_social_cloud`.
 * The server is the source of truth — the client only uses them for copy.
 * Never scatter point values across components.
 */
export const SOCIAL_CLOUD_ACTIONS = {
  first_event_rsvp: 10,
  event_linked_post: 25,
  venue_linked_post: 15,
  venue_follow: 5,
  meaningful_comment: 5,
  successful_friend_invite: 20,
} as const;

export type SocialCloudAction = keyof typeof SOCIAL_CLOUD_ACTIONS;

export const SOCIAL_CLOUD_LABELS: Record<SocialCloudAction, string> = {
  first_event_rsvp: 'Erste Zusage zu diesem Event',
  event_linked_post: 'Event-Post veröffentlicht',
  venue_linked_post: 'Post zu einem Spot veröffentlicht',
  venue_follow: 'Venue gefolgt',
  meaningful_comment: 'Kommentar geschrieben',
  successful_friend_invite: 'Freund:in eingeladen',
};

/** Ref types accepted by the award function (used for auditing only). */
export type SocialCloudRefType = 'event' | 'venue' | 'post' | 'profile' | 'comment';
