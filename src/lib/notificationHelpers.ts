import { supabase } from '@/integrations/supabase/client';

/**
 * Most notifications are created automatically via Postgres triggers
 * (see migration: notify_on_follow, notify_on_comment, notify_on_like,
 * notify_on_first_dm, notify_on_event_join, notify_followers_on_event).
 *
 * This helper is for ad-hoc client-side notification inserts when needed.
 */
export type NotificationType =
  | 'follow'
  | 'comment'
  | 'like'
  | 'message_request'
  | 'event_join_request'
  | 'event_created_by_followed_user'
  | 'event_invite'
  | 'event_message'
  | 'mention'
  | 'level_up'
  | 'moment_x_trending';

export async function createNotification(opts: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
}) {
  if (opts.recipientId === opts.actorId) return;
  const { error } = await supabase.from('notifications').insert({
    recipient_id: opts.recipientId,
    actor_id: opts.actorId,
    type: opts.type as any,
    title: opts.title,
    body: opts.body,
    ref_type: opts.refType,
    ref_id: opts.refId,
  });
  if (error) console.error('createNotification failed', error);
}

export function notificationText(type: string, username: string): string {
  switch (type) {
    case 'follow':
      return `${username} folgt dir jetzt 👤`;
    case 'comment':
      return `${username} hat dein Event kommentiert 💬`;
    case 'like':
      return `${username} mag dein Event ❤️`;
    case 'message_request':
      return `${username} hat dir geschrieben ✉️`;
    case 'event_join_request':
      return `${username} möchte zu deinem Event kommen 🎉`;
    case 'event_created_by_followed_user':
      return `${username} hat ein neues Event erstellt 📍`;
    case 'event_invite':
      return `${username} hat dich zu einem Event eingeladen 🎟️`;
    case 'event_message':
      return `${username} hat dir zum Event geschrieben 💬`;
    case 'mention':
      return `${username} hat dich erwähnt @`;
    case 'level_up':
      return `Du bist aufgestiegen! 🚀`;
    case 'moment_x_trending':
      return `Dein Moment X trendet 🔥`;
    default:
      return `${username} hat eine Aktion ausgeführt`;
  }
}

export function notificationHref(n: {
  type: string;
  ref_type: string | null;
  ref_id: string | null;
  actor?: { username: string } | null;
}): string {
  if (n.type === 'follow' && n.actor?.username) return `/profile/${n.actor.username}`;
  if (n.ref_type === 'event' && n.ref_id) return `/events/${n.ref_id}`;
  if (n.ref_type === 'profile' && n.actor?.username) return `/profile/${n.actor.username}`;
  if (n.ref_type === 'dm') return `/messages`;
  if (n.ref_type === 'post' && n.ref_id) return `/`;
  if (n.actor?.username) return `/profile/${n.actor.username}`;
  return '/';
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'gestern';
  if (d < 7) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE');
}
