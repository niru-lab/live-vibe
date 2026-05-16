import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Envelope, MapPin, CalendarBlank, CaretRight, ChatCircle, ArrowUp, ArrowDown, Check, X, Trash } from '@phosphor-icons/react';
import { useEventMessages, useMarkMessageRead } from '@/hooks/useEventMessages';
import { useConversations, useDeleteDM, useMarkDMRead, type Conversation } from '@/hooks/useDirectMessages';
import { useAllChatRequests, useAcceptChatRequest, useDeclineChatRequest } from '@/hooks/useChatRequest';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { SendMessageDialog } from '@/components/messaging/SendMessageDialog';

type Tab = 'chats' | 'requests';

export default function Messages() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: receivedMessages, isLoading: receivedLoading, refetch } = useEventMessages();
  const markRead = useMarkMessageRead();
  const { data: conversations, isLoading: convLoading } = useConversations();
  const { data: chatRequests = [] } = useAllChatRequests();
  const acceptReq = useAcceptChatRequest();
  const declineReq = useDeclineChatRequest();
  const deleteDM = useDeleteDM();
  const markDMRead = useMarkDMRead();
  const [tab, setTab] = useState<Tab>('chats');
  const [openChat, setOpenChat] = useState<Conversation['other'] | null>(null);

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

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('messages-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `recipient_id=eq.${profile.id}` }, () => { refetch(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `sender_id=eq.${profile.id}` }, () => { refetchSent(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, refetch, refetchSent]);

  const eventMessages = [
    ...(receivedMessages || []).map((msg) => ({ ...msg, isSent: false })),
    ...(sentMessages || []).map((msg: any) => ({ ...msg, isSent: true })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Build status map for the OTHER user in each conversation.
  const reqByOther = new Map<string, any>();
  for (const r of chatRequests) {
    const otherId = r.sender_id === profile?.id ? r.recipient_id : r.sender_id;
    const existing = reqByOther.get(otherId);
    if (!existing || new Date(r.created_at).getTime() > new Date(existing.created_at).getTime()) {
      reqByOther.set(otherId, r);
    }
  }
  const statusFor = (otherId: string): { kind: 'accepted' | 'pending_incoming' | 'pending_outgoing' | 'declined' | 'none'; requestId?: string } => {
    const r = reqByOther.get(otherId);
    if (!r) return { kind: 'none' };
    if (r.status === 'accepted') return { kind: 'accepted', requestId: r.id };
    if (r.status === 'declined') return { kind: 'declined', requestId: r.id };
    return { kind: r.sender_id === profile?.id ? 'pending_outgoing' : 'pending_incoming', requestId: r.id };
  };

  const incomingRequests = (conversations || []).filter((c) => statusFor(c.otherId).kind === 'pending_incoming');
  const chatList = (conversations || []).filter((c) => {
    const k = statusFor(c.otherId).kind;
    return k === 'accepted' || k === 'pending_outgoing' || k === 'none' || k === 'declined';
  });

  const requestsCount = incomingRequests.length;
  const unreadCount = (receivedMessages?.filter((m) => !m.is_read).length || 0) + requestsCount;
  const isLoading = receivedLoading || sentLoading || convLoading;

  const handleEventMessageClick = async (message: any) => {
    if (!message.isSent && !message.is_read) await markRead.mutateAsync(message.id);
    navigate(`/events/${message.event_id}`);
  };

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-[#F5F5F7] dark:bg-[#0A0A0F] -z-10" />
      <header className="sticky top-0 z-40 bg-[#F5F5F7]/80 dark:bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
              <Envelope weight="fill" className="h-4 w-4 text-[#7C3AED]" />
            </div>
            <span className="text-lg font-display font-bold text-[#0A0A0F] dark:text-white">Nachrichten</span>
            {unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0">{unreadCount} neu</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3">
          <button
            onClick={() => setTab('chats')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs transition-all',
              tab === 'chats'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold'
                : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-[#A0A0B0] font-medium',
            )}
          >
            Chats
          </button>
          <button
            onClick={() => setTab('requests')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5',
              tab === 'requests'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-bold'
                : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-[#A0A0B0] font-medium',
            )}
          >
            Anfragen
            {requestsCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EC4899] px-1 text-[9px] font-bold text-white">
                {requestsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-3">
        {isLoading ? (
          <MessagesSkeleton />
        ) : tab === 'requests' ? (
          incomingRequests.length === 0 ? (
            <EmptyState text="Keine offenen Anfragen" />
          ) : (
            incomingRequests.map((c) => {
              const s = statusFor(c.otherId);
              return (
                <RequestCard
                  key={c.otherId}
                  conv={c}
                  onAccept={() => s.requestId && acceptReq.mutate(s.requestId)}
                  onDecline={() => s.requestId && declineReq.mutate(s.requestId)}
                  onOpen={() => setOpenChat(c.other)}
                />
              );
            })
          )
        ) : chatList.length === 0 && eventMessages.length === 0 ? (
          <EmptyState text="Keine Nachrichten" />
        ) : (
          <>
            {chatList.map((c) => {
              const s = statusFor(c.otherId);
              return (
                <ChatCard
                  key={c.otherId}
                  conv={c}
                  meId={profile?.id}
                  pendingOutgoing={s.kind === 'pending_outgoing'}
                  declined={s.kind === 'declined'}
                  onClick={() => {
                    if (c.unread) markDMRead.mutate(c.lastMessage.id);
                    setOpenChat(c.other);
                  }}
                  onDelete={() => deleteDM.mutate(c.lastMessage.id)}
                />
              );
            })}
            {eventMessages.map((message) => (
              <MessageCard
                key={`${message.id}-${message.isSent ? 'sent' : 'received'}`}
                message={message}
                isSent={message.isSent}
                onClick={() => handleEventMessageClick(message)}
              />
            ))}
          </>
        )}
      </div>

      {openChat && (
        <SendMessageDialog
          open={!!openChat}
          onOpenChange={(o) => !o && setOpenChat(null)}
          recipient={openChat as any}
        />
      )}
    </AppLayout>
  );
}

const cardBase =
  'rounded-2xl p-4 bg-white border border-gray-200 dark:bg-[#12121A] dark:border-white/10';

function RequestCard({ conv, onAccept, onDecline, onOpen }: { conv: Conversation; onAccept: () => void; onDecline: () => void; onOpen: () => void }) {
  const o = conv.other;
  return (
    <div className={cn(cardBase, 'ring-2 ring-[#7C3AED]/30')}>
      <button onClick={onOpen} className="w-full text-left flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-[#7C3AED]/40">
          <AvatarImage src={o?.avatar_url || ''} />
          <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white">
            {o?.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{o?.display_name}</p>
            <span className="text-xs text-gray-500 dark:text-[#A0A0B0]">@{o?.username}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#A0A0B0] mb-2">möchte mit dir schreiben</p>
          <p className="text-sm text-gray-800 dark:text-white/90 line-clamp-3 break-words">{conv.lastMessage.content}</p>
          <p className="text-[11px] text-gray-500 dark:text-[#A0A0B0] mt-2">
            {format(new Date(conv.lastMessage.created_at), 'dd. MMM, HH:mm', { locale: de })}
          </p>
        </div>
      </button>
      <div className="flex gap-2 mt-3">
        <Button onClick={onAccept} size="sm" className="flex-1 gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0">
          <Check weight="bold" className="h-4 w-4" /> Annehmen
        </Button>
        <Button
          onClick={onDecline}
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
        >
          <X weight="bold" className="h-4 w-4" /> Ablehnen
        </Button>
      </div>
    </div>
  );
}

function ChatCard({
  conv,
  meId,
  pendingOutgoing,
  declined,
  onClick,
  onDelete,
}: {
  conv: Conversation;
  meId?: string;
  pendingOutgoing: boolean;
  declined: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const isSent = conv.lastMessage.sender_id === meId;
  const o = conv.other;
  return (
    <div className={cn(cardBase, conv.unread && 'ring-2 ring-[#7C3AED]/40')}>
      <button onClick={onClick} className="w-full text-left flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-[#7C3AED]/40">
            <AvatarImage src={o?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white">{o?.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={cn('absolute -bottom-1 -right-1 rounded-full p-1', isSent ? 'bg-[#7C3AED]' : 'bg-[#EC4899]')}>
            {isSent ? <ArrowUp weight="bold" className="h-2.5 w-2.5 text-white" /> : <ArrowDown weight="bold" className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{o?.display_name}</p>
            {conv.unread && <div className="h-2 w-2 rounded-full bg-[#EC4899] animate-pulse" />}
          </div>
          <p className="text-sm text-gray-700 dark:text-white/80 line-clamp-2 break-words">{conv.lastMessage.content}</p>
          {pendingOutgoing && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Nachricht gesendet — warte auf Bestätigung</p>
          )}
          {declined && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">Anfrage wurde abgelehnt</p>
          )}
          <p className="text-[11px] text-gray-500 dark:text-[#A0A0B0] mt-1">
            {format(new Date(conv.lastMessage.created_at), 'dd. MMM, HH:mm', { locale: de })}
          </p>
        </div>
      </button>
      <button onClick={onDelete} className="mt-2 text-[11px] text-gray-500 dark:text-[#A0A0B0] hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1">
        <Trash weight="bold" className="h-3 w-3" /> Löschen
      </button>
    </div>
  );
}

function MessageCard({ message, isSent, onClick }: { message: any; isSent: boolean; onClick: () => void }) {
  const person = isSent ? message.recipient : message.sender;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.02]',
        'bg-white border border-gray-200 dark:bg-[#12121A] dark:border-white/10',
        !isSent && !message.is_read && 'ring-2 ring-[#7C3AED]/50',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-[#7C3AED]/40">
            <AvatarImage src={person?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white">{person?.display_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${isSent ? 'bg-[#7C3AED]' : 'bg-[#EC4899]'}`}>
            {isSent ? <ArrowUp weight="bold" className="h-2.5 w-2.5 text-white" /> : <ArrowDown weight="bold" className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-[#A0A0B0]">{isSent ? 'An:' : 'Von:'}</span>
            <p className="font-semibold text-base truncate text-gray-900 dark:text-white">{person?.display_name}</p>
            {!isSent && !message.is_read && <div className="h-2 w-2 rounded-full bg-[#EC4899] animate-pulse" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-[#A0A0B0] truncate mb-2">Re: {message.event?.name}</p>
          <p className="text-sm line-clamp-2 text-gray-700 dark:text-white/80">{message.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-[#A0A0B0]">
            <span className="flex items-center gap-1">
              <CalendarBlank weight="thin" className="h-3 w-3" />
              {format(new Date(message.created_at), 'dd. MMM, HH:mm', { locale: de })}
            </span>
            {message.includes_address && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-500"><MapPin weight="thin" className="h-3 w-3" /> Adresse</span>
            )}
            {isSent && message.is_read && <span className="flex items-center gap-1 text-blue-500">✓✓ Gelesen</span>}
          </div>
        </div>
        <CaretRight weight="thin" className="h-5 w-5 text-gray-400 dark:text-[#A0A0B0] shrink-0" />
      </div>
    </button>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cardBase}>
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /><Skeleton className="h-10 w-full" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-[#A0A0B0]">
        <ChatCircle weight="thin" className="h-10 w-10" />
      </div>
      <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-white">{text}</h3>
      <p className="text-sm text-gray-500 dark:text-[#A0A0B0] max-w-xs">Sobald jemand dir schreibt, erscheinen die Nachrichten hier.</p>
    </div>
  );
}
