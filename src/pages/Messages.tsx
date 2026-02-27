import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Envelope, MapPin, CalendarBlank, CaretRight, ChatCircle, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { useEventMessages, useMarkMessageRead } from '@/hooks/useEventMessages';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export default function Messages() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: receivedMessages, isLoading: receivedLoading, refetch } = useEventMessages();
  const markRead = useMarkMessageRead();

  const { data: sentMessages, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ['sent-messages', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('event_messages')
        .select(`*, event:events(id, name, address, location_name), recipient:profiles!event_messages_recipient_id_fkey(id, username, display_name, avatar_url)`)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const allMessages = [
    ...(receivedMessages || []).map(msg => ({ ...msg, isSent: false })),
    ...(sentMessages || []).map((msg: any) => ({ ...msg, isSent: true })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('messages-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `recipient_id=eq.${profile.id}` }, () => { refetch(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `sender_id=eq.${profile.id}` }, () => { refetchSent(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, refetch, refetchSent]);

  const handleMessageClick = async (message: any) => {
    if (!message.isSent && !message.is_read) await markRead.mutateAsync(message.id);
    navigate(`/events/${message.event_id}`);
  };

  const unreadCount = receivedMessages?.filter(m => !m.is_read).length || 0;
  const isLoading = receivedLoading || sentLoading;

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-gradient-hero -z-10" />
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} neu</Badge>}
          </div>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-3">
        {isLoading ? <MessagesSkeleton /> : allMessages.length > 0 ? (
          allMessages.map((message) => (
            <MessageCard key={`${message.id}-${message.isSent ? 'sent' : 'received'}`} message={message} isSent={message.isSent} onClick={() => handleMessageClick(message)} />
          ))
        ) : <EmptyState />}
      </div>
    </AppLayout>
  );
}

function MessageCard({ message, isSent, onClick }: { message: any; isSent: boolean; onClick: () => void }) {
  const person = isSent ? message.recipient : message.sender;
  return (
    <button onClick={onClick} className={`w-full text-left glass rounded-2xl p-4 transition-all hover:scale-[1.02] ${!isSent && !message.is_read ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-primary/30">
            <AvatarImage src={person?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-neon text-white">{person?.display_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${isSent ? 'bg-blue-500' : 'bg-green-500'}`}>
            {isSent ? <ArrowUp weight="bold" className="h-2.5 w-2.5 text-white" /> : <ArrowDown weight="bold" className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{isSent ? 'An:' : 'Von:'}</span>
            <p className="font-semibold truncate">{person?.display_name}</p>
            {!isSent && !message.is_read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
          </div>
          <p className="text-sm text-muted-foreground truncate mb-2">Re: {message.event?.name}</p>
          <p className="text-sm line-clamp-2 text-foreground/80">{message.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarBlank weight="thin" className="h-3 w-3" />
              {format(new Date(message.created_at), 'dd. MMM, HH:mm', { locale: de })}
            </span>
            {message.includes_address && (
              <span className="flex items-center gap-1 text-green-500"><MapPin weight="thin" className="h-3 w-3" /> Adresse</span>
            )}
            {isSent && message.is_read && <span className="flex items-center gap-1 text-blue-500">✓✓ Gelesen</span>}
          </div>
        </div>
        <CaretRight weight="thin" className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /><Skeleton className="h-10 w-full" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass text-muted-foreground">
        <ChatCircle weight="thin" className="h-10 w-10" />
      </div>
      <h3 className="font-semibold mb-1">Keine Nachrichten</h3>
      <p className="text-sm text-muted-foreground max-w-xs">Wenn du Events erstellst oder für Events akzeptiert wirst, erscheinen hier deine Nachrichten.</p>
    </div>
  );
}
