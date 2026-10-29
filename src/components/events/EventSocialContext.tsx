import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, usePublicProfiles } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Crew context is limited to the existing opt-in, max-eight attendee preview. */
export function EventSocialContext({ eventId }: { eventId: string }) {
  const { data: viewer } = useProfile();
  const { data: visibleIds = [] } = useQuery({
    queryKey: ['visible-attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_visible_attendees', { _event_id: eventId });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
  const { data: following = new Set<string>() } = useQuery({
    queryKey: ['viewer-following-ids', viewer?.id],
    enabled: !!viewer?.id,
    queryFn: async () => {
      if (!viewer) return new Set<string>();
      const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', viewer.id);
      if (error) throw error;
      return new Set((data ?? []).map(row => row.following_id));
    },
    staleTime: 30_000,
  });
  const crewIds = visibleIds.filter(id => following.has(id));
  const { data: profiles } = usePublicProfiles(crewIds);
  if (!crewIds.length) return null;
  return (
    <div className="flex min-w-0 items-center gap-2 py-1" aria-label="Sichtbare Zusagen aus deiner Crew">
      <div className="flex shrink-0 -space-x-2">
        {crewIds.slice(0, 3).map(id => (
          <Avatar key={id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={profiles?.[id]?.avatar_url ?? ''} alt={profiles?.[id]?.display_name ?? ''} />
            <AvatarFallback className="text-[10px]">{profiles?.[id]?.display_name?.charAt(0) ?? '·'}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{crewIds.length === 1 ? 'Jemand aus deiner Crew geht hin' : `${crewIds.length} aus deiner Crew gehen hin`}</span>
    </div>
  );
}