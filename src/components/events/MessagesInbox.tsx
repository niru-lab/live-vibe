import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Envelope, MapPin, CalendarBlank, Check, CaretRight } from '@phosphor-icons/react';
import { useEventMessages, useMarkMessageRead, useUnreadMessageCount } from '@/hooks/useEventMessages';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface MessagesInboxProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function MessagesInbox({ open, onOpenChange }: MessagesInboxProps) {
  const navigate = useNavigate();
  const { data: messages, isLoading, refetch } = useEventMessages();
  const { data: unreadCount } = useUnreadMessageCount();
  const markRead = useMarkMessageRead();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel('messages-inbox').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `recipient_id=eq.${profile.id}` }, () => { refetch(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, refetch]);

  const handleMessageClick = async (message: any) => {
    if (!message.is_read) await markRead.mutateAsync(message.id);
    navigate(`/events/${message.event_id}`); onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl glass">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold gradient-text flex items-center gap-2">
            <Envelope weight="thin" className="h-5 w-5" />Nachrichten
            {unreadCount && unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} neu</Badge>}
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(80vh-100px)] space-y-3 pb-20">
          {isLoading ? <MessagesSkeleton /> : messages && messages.length > 0 ? (
            messages.map((message) => (
              <button key={message.id} onClick={() => handleMessageClick(message)} className={`w-full text-left glass rounded-2xl p-4 transition-all hover:scale-[1.02] ${!message.is_read ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30"><AvatarImage src={message.sender?.avatar_url || ''} /><AvatarFallback className="bg-gradient-neon text-white">{message.sender?.display_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><p className="font-semibold truncate">{message.sender?.display_name}</p>{!message.is_read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}</div>
                    <p className="text-sm text-muted-foreground truncate mb-2">Re: {message.event?.name}</p>
                    <p className="text-sm line-clamp-2 text-foreground/80">{message.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarBlank weight="thin" className="h-3 w-3" />{format(new Date(message.created_at), 'dd. MMM, HH:mm', { locale: de })}</span>
                      {message.includes_address && <span className="flex items-center gap-1 text-green-500"><MapPin weight="thin" className="h-3 w-3" />Adresse enthalten</span>}
                    </div>
                  </div>
                  <CaretRight weight="thin" className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass"><Envelope weight="thin" className="h-10 w-10 text-muted-foreground" /></div>
              <h3 className="font-semibold text-foreground mb-1">Keine Nachrichten</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Wenn du für Events akzeptiert wirst, erhältst du hier Nachrichten mit Details.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessagesSkeleton() { return (<div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="glass rounded-2xl p-4"><div className="flex items-start gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /><Skeleton className="h-10 w-full" /></div></div></div>))}</div>); }

export function MessagesButton({ onClick }: { onClick: () => void }) {
  const { data: unreadCount } = useUnreadMessageCount();
  return (
    <Button variant="ghost" size="icon" className="relative" onClick={onClick}>
      <Envelope weight="thin" className="h-5 w-5" />
      {unreadCount && unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </Button>
  );
}
