import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePublicProfiles } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Max. 8 avatars of attendees who opted in to showing their attendance. No full list. */
export const VisibleAttendees = ({ eventId }: { eventId: string }) => {
  const { data: ids = [] } = useQuery({
    queryKey: ['visible-attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('event_visible_attendees', { _event_id: eventId });
      if (error) throw error;
      return (data ?? []) as string[];
    },
  });
  const { data: profiles } = usePublicProfiles(ids);
  if (!ids.length) return null;
  return (
    <div className="mt-2 flex -space-x-2">
      {ids.map((id) => {
        const p = profiles?.[id];
        return (
          <Avatar key={id} className="h-7 w-7 border-2 border-background">
            <AvatarImage src={p?.avatar_url || ''} />
            <AvatarFallback className="text-xs">{p?.display_name?.charAt(0) ?? '·'}</AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
};
