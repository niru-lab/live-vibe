import { AppLayout } from '@/components/layout/AppLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useRooms } from '@/hooks/useRooms';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, MapPin, Users, Lightning, SignOut, Check, X, PaperPlaneRight, Trash, Gear, Lock } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { leaveRoom } = useRooms();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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
      return data as any;
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
      return data as any[];
    },
  });

  const myMembership = members.find(m => m.user_id === profile?.id);
  const isHoster = room?.hoster_id === profile?.id;
  const isApproved = myMembership?.status === 'approved' || isHoster;
  const isPending = myMembership?.status === 'pending';
  const chatPolicy: string = room?.chat_policy ?? 'members';
  const requiresApproval: boolean = room?.requires_approval ?? true;
  const canPost = isHoster || (isApproved && chatPolicy === 'members');

  const approved = members.filter(m => m.status === 'approved');
  const pending = members.filter(m => m.status === 'pending');

  const { data: posts = [] } = useQuery({
    queryKey: ['room-posts', id],
    enabled: !!id && isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_posts' as any)
        .select('*, author:profiles!room_posts_author_id_fkey(id, username, display_name, avatar_url)')
        .eq('room_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!profile?.id || !id) throw new Error('Not ready');
      const { error } = await supabase
        .from('room_posts' as any)
        .insert({ room_id: id, author_id: profile.id, content } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setPostContent('');
      queryClient.invalidateQueries({ queryKey: ['room-posts', id] });
      toast.success('Gepostet');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('room_posts' as any).delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-posts', id] }),
    onError: (e: any) => toast.error(e.message),
  });

  const updateMemberStatus = useMutation({
    mutationFn: async ({ memberId, action }: { memberId: string; action: 'approve' | 'reject' }) => {
      if (action === 'approve') {
        const { error } = await supabase.from('room_members').update({ status: 'approved' } as any).eq('id', memberId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('room_members').delete().eq('id', memberId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-members', id] });
      toast.success('Aktualisiert');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateRoomSettings = useMutation({
    mutationFn: async (patch: { requires_approval?: boolean; chat_policy?: string }) => {
      const { error } = await supabase.from('rooms').update(patch as any).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Einstellung gespeichert');
    },
    onError: (e: any) => toast.error(e.message),
  });

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
            <p className="text-xs text-muted-foreground">{room.category}</p>
          </div>
          {isHoster && (
            <>
              <Badge>Hoster</Badge>
              <button onClick={() => setShowSettings(s => !s)} className="p-1">
                <Gear weight="bold" className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Settings (Hoster) */}
        {isHoster && showSettings && (
          <div className="glass rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Einstellungen</h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-foreground">Beitritt bestätigen</p>
                <p className="text-xs text-muted-foreground">Neue Mitglieder müssen von dir akzeptiert werden</p>
              </div>
              <Switch
                checked={requiresApproval}
                onCheckedChange={(v) => updateRoomSettings.mutate({ requires_approval: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-foreground">Nur Host darf schreiben</p>
                <p className="text-xs text-muted-foreground">Mitglieder können dann nur lesen</p>
              </div>
              <Switch
                checked={chatPolicy === 'hoster_only'}
                onCheckedChange={(v) => updateRoomSettings.mutate({ chat_policy: v ? 'hoster_only' : 'members' })}
              />
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="glass rounded-2xl p-4 space-y-3">
          {room.description && (
            <p className="text-sm text-muted-foreground">{room.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {room.city && (
              <span className="flex items-center gap-1">
                <MapPin weight="fill" className="h-3 w-3" /> {room.city}
              </span>
            )}
            {room.activity && (
              <span className="flex items-center gap-1">
                <Lightning weight="fill" className="h-3 w-3" /> {room.activity}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users weight="fill" className="h-3 w-3" /> {approved.length} Mitglieder
            </span>
          </div>
        </div>

        {isPending && (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
            Deine Beitritts-Anfrage wartet auf Bestätigung durch den Host.
          </div>
        )}

        {/* Pending Requests (Hoster) */}
        {isHoster && pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Anfragen ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map(m => (
                <div key={m.id} className="flex items-center gap-3 glass rounded-xl p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.profile?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">{m.profile?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profile?.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.profile?.username}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => updateMemberStatus.mutate({ memberId: m.id, action: 'approve' })}>
                    <Check weight="bold" className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => updateMemberStatus.mutate({ memberId: m.id, action: 'reject' })}>
                    <X weight="bold" className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {isApproved && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Beiträge</h2>
              {chatPolicy === 'hoster_only' && !isHoster && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock weight="fill" className="h-3 w-3" /> Nur Host postet
                </span>
              )}
            </div>

            {canPost && (
              <div className="glass rounded-2xl p-3 space-y-2">
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Schreib etwas in den Room..."
                  className="border-0 bg-transparent resize-none min-h-[60px] focus-visible:ring-0"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!postContent.trim() || createPost.isPending}
                    onClick={() => createPost.mutate(postContent.trim())}
                    className="gap-1.5"
                  >
                    <PaperPlaneRight weight="fill" className="h-4 w-4" /> Posten
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Noch keine Beiträge</p>
              ) : (
                posts.map((p: any) => {
                  const canDelete = p.author_id === profile?.id || isHoster;
                  return (
                    <div key={p.id} className="glass rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.author?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">{p.author?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.author?.display_name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: de })}</p>
                        </div>
                        {canDelete && (
                          <button onClick={() => deletePost.mutate(p.id)} className="p-1 text-muted-foreground hover:text-destructive">
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Mitglieder</h2>
          <div className="space-y-2">
            {approved.map(m => (
              <div key={m.id} className="flex items-center gap-3 glass rounded-xl p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{m.profile?.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{m.profile?.username}</p>
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
