import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEventSocialProof } from '@/hooks/useEventSocialProof';
import { track, type RsvpSurface } from '@/lib/analytics';
import { Users, Heart, Images, Sparkle } from '@phosphor-icons/react';

interface EventSocialProofCardProps {
  eventId: string;
  surface: RsvpSurface;
  compact?: boolean;
}

/**
 * Aggregate, privacy-safe social proof for an event.
 * Shows counts + only the profiles the viewer already follows.
 * RSVP is intent — copy always says "Zusagen", never "sind gerade hier".
 */
export const EventSocialProofCard = ({ eventId, surface, compact }: EventSocialProofCardProps) => {
  const { data } = useEventSocialProof(eventId);

  const hasSignal = !!data && (data.going > 0 || data.interested > 0 || data.postCount > 0);
  const friendCount = data?.followedGoing.length ?? 0;

  useEffect(() => {
    if (!hasSignal) return;
    track('event_social_proof_viewed', { eventId, surface, count: data?.going });
    if (friendCount > 0) track('event_friend_signal_viewed', { eventId, surface, count: friendCount });
  }, [hasSignal, friendCount, eventId, surface]);

  if (!hasSignal || !data) return null;

  const parts: string[] = [];
  if (data.going > 0) parts.push(`${data.going} ${data.going === 1 ? 'Zusage' : 'Zusagen'}`);
  if (data.interested > 0) parts.push(`${data.interested} interessiert`);
  if (data.postCount > 0) parts.push(`${data.postCount} Live ${data.postCount === 1 ? 'Post' : 'Posts'}`);

  return (
    <div
      className={`rounded-2xl border border-border/50 bg-card ${compact ? 'p-3' : 'p-4'}`}
      data-testid="event-social-proof"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
        {data.going > 0 && (
          <span className="flex items-center gap-1">
            <Users weight="thin" className="h-4 w-4 text-primary" />
            {data.going} {data.going === 1 ? 'Zusage' : 'Zusagen'}
          </span>
        )}
        {data.interested > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Heart weight="thin" className="h-4 w-4" />
            {data.interested} interessiert
          </span>
        )}
        {data.postCount > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Images weight="thin" className="h-4 w-4" />
            {data.postCount} Live {data.postCount === 1 ? 'Post' : 'Posts'}
          </span>
        )}
      </div>

      {friendCount > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {data.followedGoing.slice(0, 4).map((p) => (
              <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={p.avatar_url || ''} alt="" />
                <AvatarFallback className="text-[10px]">{p.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {friendCount === 1
              ? '1 Person, der du folgst, geht hin'
              : `${friendCount} Leute, denen du folgst, gehen hin`}
          </span>
        </div>
      )}

      {data.hasRecentActivity && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
          <Sparkle weight="fill" className="h-3.5 w-3.5" />
          Gerade passiert etwas bei diesem Spot
        </p>
      )}

      {!compact && parts.length > 1 && (
        <p className="sr-only">{parts.join(' · ')}</p>
      )}
    </div>
  );
};
