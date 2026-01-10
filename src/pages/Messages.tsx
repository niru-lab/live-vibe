import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, Inbox, MapPin, Calendar, ChevronRight, MessageCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('received');

  // Fetch sent messages
  const { data: sentMessages, isLoading: sentLoading } = useQuery({
    queryKey: ['sent-messages', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('event_messages')
        .select(`
          *,
          event:events(id, name, address, location_name),
          recipient:profiles!event_messages_recipient_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('messages-page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, refetch]);

  const handleMessageClick = async (message: any, isSent: boolean) => {
    if (!isSent && !message.is_read) {
      await markRead.mutateAsync(message.id);
    }
    navigate(`/events/${message.event_id}`);
  };

  const unreadCount = receivedMessages?.filter(m => !m.is_read).length || 0;

  return (
    <AppLayout>
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-hero -z-10" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h1 className="font-display text-xl font-bold gradient-text">Nachrichten</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">
                {unreadCount} neu
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="w-full glass rounded-2xl p-1">
            <TabsTrigger 
              value="received" 
              className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white gap-2"
            >
              <Inbox className="h-4 w-4" />
              Empfangen
              {unreadCount > 0 && (
                <Badge className="bg-white/20 text-white text-xs px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Gesendet
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="received" className="mt-0 space-y-3">
            {receivedLoading ? (
              <MessagesSkeleton />
            ) : receivedMessages && receivedMessages.length > 0 ? (
              receivedMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isSent={false}
                  onClick={() => handleMessageClick(message, false)}
                />
              ))
            ) : (
              <EmptyState 
                icon={<Inbox className="h-10 w-10" />}
                title="Keine Nachrichten"
                description="Wenn du für Events akzeptiert wirst, erhältst du hier Nachrichten mit Details."
              />
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0 space-y-3">
            {sentLoading ? (
              <MessagesSkeleton />
            ) : sentMessages && sentMessages.length > 0 ? (
              sentMessages.map((message: any) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isSent={true}
                  onClick={() => handleMessageClick(message, true)}
                />
              ))
            ) : (
              <EmptyState 
                icon={<Send className="h-10 w-10" />}
                title="Keine gesendeten Nachrichten"
                description="Wenn du Events erstellst und Gäste akzeptierst, kannst du ihnen hier Nachrichten senden."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface MessageCardProps {
  message: any;
  isSent: boolean;
  onClick: () => void;
}

function MessageCard({ message, isSent, onClick }: MessageCardProps) {
  const person = isSent ? message.recipient : message.sender;
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left glass rounded-2xl p-4 transition-all hover:scale-[1.02] hover-lift ${
        !isSent && !message.is_read ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-primary/30">
          <AvatarImage src={person?.avatar_url || ''} />
          <AvatarFallback className="bg-gradient-neon text-white">
            {person?.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">
              {isSent ? 'An: ' : ''}{person?.display_name}
            </p>
            {!isSent && !message.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground truncate mb-2">
            Re: {message.event?.name}
          </p>

          <p className="text-sm line-clamp-2 text-foreground/80">
            {message.content}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(message.created_at), 'dd. MMM, HH:mm', { locale: de })}
            </span>
            {message.includes_address && (
              <span className="flex items-center gap-1 text-green-500">
                <MapPin className="h-3 w-3" />
                Adresse
              </span>
            )}
            {isSent && message.is_read && (
              <span className="flex items-center gap-1 text-blue-500">
                ✓✓ Gelesen
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
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
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass neon-glow-sm text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold gradient-text mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
