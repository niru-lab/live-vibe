import { AppLayout } from '@/components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useRooms } from '@/hooks/useRooms';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Users, Lightning, SignOut } from '@phosphor-icons/react';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { leaveRoom } = useRooms();

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, hoster:profiles!rooms_hoster_id_fkey(id, username, display_name, avatar_url)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['room-members', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_members')
        .select('*, profile:profiles!room_members_user_id_fkey(id, username, display_name, avatar_url)')
        .eq('room_id', id!);
      if (error) throw error;
      return data;
    },
  });

  const myMembership = members.find(m => m.user_id === profile?.id);
  const isHoster = room?.hoster_id === profile?.id;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-14 pb-32 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!room) {
    return (
      <AppLayout>
        <div className="px-4 pt-14 pb-32 text-center">
          <p className="text-muted-foreground">Room nicht gefunden</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-14 pb-32 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/roomz')} className="p-1">
            <ArrowLeft weight="bold" className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{room.name}</h1>
            <p className="text-xs text-muted-foreground">{(room as any).category}</p>
          </div>
          {isHoster && <Badge>Hoster</Badge>}
        </div>

        {/* Info Card */}
        <div className="glass rounded-2xl p-4 space-y-3">
          {(room as any).description && (
            <p className="text-sm text-muted-foreground">{(room as any).description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(room as any).city && (
              <span className="flex items-center gap-1">
                <MapPin weight="fill" className="h-3 w-3" /> {(room as any).city}
              </span>
            )}
            {(room as any).activity && (
              <span className="flex items-center gap-1">
                <Lightning weight="fill" className="h-3 w-3" /> {(room as any).activity}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users weight="fill" className="h-3 w-3" /> {members.length} Mitglieder
            </span>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Mitglieder</h2>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 glass rounded-xl p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(m as any).profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{(m as any).profile?.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{(m as any).profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{(m as any).profile?.username}</p>
                </div>
                <Badge variant="outline" className="text-xs">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Leave button (non-hosters) */}
        {myMembership && !isHoster && (
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/20"
            onClick={() => { leaveRoom.mutate(room.id); navigate('/roomz'); }}
          >
            <SignOut className="h-4 w-4" /> Room verlassen
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default RoomDetail;
