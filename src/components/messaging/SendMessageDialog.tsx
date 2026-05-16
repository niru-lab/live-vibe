import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PaperPlaneTilt, Check, X } from '@phosphor-icons/react';
import { useSendDM, useDirectMessages } from '@/hooks/useDirectMessages';
import { useProfile } from '@/hooks/useProfile';
import { useChatRequestStatus, useAcceptChatRequest, useDeclineChatRequest } from '@/hooks/useChatRequest';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: { id: string; username: string; display_name: string; avatar_url: string | null };
}

interface OptimisticMsg {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  optimistic: true;
}

export function SendMessageDialog({ open, onOpenChange, recipient }: SendMessageDialogProps) {
  const [content, setContent] = useState('');
  const [optimistic, setOptimistic] = useState<OptimisticMsg[]>([]);
  const sendDM = useSendDM();
  const { data: myProfile } = useProfile();
  const { data: allDms = [] } = useDirectMessages();
  const { data: chatStatus } = useChatRequestStatus(recipient.id);
  const acceptReq = useAcceptChatRequest();
  const declineReq = useDeclineChatRequest();
  const scrollRef = useRef<HTMLDivElement>(null);

  const status = chatStatus?.status ?? 'none';
  const isPendingIncoming = status === 'pending_incoming';
  const isDeclined = status === 'declined';
  const isPendingOutgoing = status === 'pending_outgoing';
  const inputDisabled = isPendingIncoming || isDeclined;

  const conversation = useMemo(() => {
    const real = (allDms || []).filter(
      (m) =>
        (m.sender_id === recipient.id && m.recipient_id === myProfile?.id) ||
        (m.recipient_id === recipient.id && m.sender_id === myProfile?.id),
    );
    const realContents = new Set(real.map((m) => `${m.sender_id}:${m.content}`));
    const opt = optimistic.filter((o) => !realContents.has(`${o.sender_id}:${o.content}`));
    return [...real, ...opt].sort((a: any, b: any) => {
      const at = (a as any).created_at || '';
      const bt = (b as any).created_at || '';
      return at.localeCompare(bt);
    });
  }, [allDms, optimistic, recipient.id, myProfile?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation.length]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || !myProfile?.id) return;
    const tempId = `opt-${Date.now()}`;
    setOptimistic((prev) => [
      ...prev,
      { id: tempId, content: trimmed, sender_id: myProfile.id, recipient_id: recipient.id, optimistic: true },
    ]);
    setContent('');
    try {
      await sendDM.mutateAsync({ recipientId: recipient.id, content: trimmed });
    } catch (e: any) {
      setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
      toast({ title: 'Fehler', description: e.message || 'Konnte nicht senden', variant: 'destructive' });
    }
  };

  const acceptRequestId = chatStatus?.requestId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="chat-container"
        className="bg-white dark:bg-[#12121A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white max-w-md flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={recipient.avatar_url || ''} />
              <AvatarFallback className="bg-gray-100 dark:bg-[#1A1A24] text-gray-700 dark:text-white text-xs">
                {recipient.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{recipient.display_name}</p>
              <p className="text-[11px] text-gray-500 dark:text-[#A0A0B0] font-normal">@{recipient.username}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isPendingIncoming && acceptRequestId && (
          <div className="mx-5 mt-3 rounded-xl border border-[#7C3AED]/40 bg-purple-50 dark:bg-[#7C3AED]/10 p-3">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-semibold">{recipient.display_name}</span> möchte mit dir schreiben
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => acceptReq.mutate(acceptRequestId)}
                className="flex-1 gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0"
              >
                <Check weight="bold" className="h-4 w-4" /> Annehmen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineReq.mutate(acceptRequestId)}
                className="flex-1 gap-1.5 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                <X weight="bold" className="h-4 w-4" /> Ablehnen
              </Button>
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="mx-5 mt-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            Anfrage wurde abgelehnt
          </div>
        )}

        {isPendingOutgoing && (
          <div className="mx-5 mt-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            Nachricht gesendet — warte auf Bestätigung
          </div>
        )}

        <div
          ref={scrollRef}
          className={cn(
            'px-5 py-3 max-h-[40vh] min-h-[180px] overflow-y-auto flex flex-col gap-2',
            isPendingIncoming && 'opacity-60',
          )}
        >
          {conversation.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-[#A0A0B0] text-center py-6">Noch keine Nachrichten</p>
          ) : (
            conversation.map((m: any) => {
              const isMine = m.sender_id === myProfile?.id;
              return (
                <div
                  key={m.id}
                  data-testid={isMine ? 'chat-message-sent' : 'chat-message-received'}
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                    isMine
                      ? 'self-end bg-purple-100 text-purple-900 dark:bg-purple-600 dark:text-white'
                      : 'self-start bg-white border border-gray-200 text-gray-900 dark:bg-white/10 dark:text-white dark:border-transparent',
                  )}
                >
                  <span data-testid="chat-message">{m.content}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 flex items-end gap-2 bg-white dark:bg-white/[0.02]">
          <Textarea
            data-testid="chat-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={inputDisabled ? (isDeclined ? 'Anfrage wurde abgelehnt' : 'Anfrage zuerst annehmen') : 'Nachricht…'}
            disabled={inputDisabled}
            className="min-h-[44px] max-h-[120px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-[#A0A0B0] resize-none disabled:opacity-60"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            data-testid="chat-send-btn"
            onClick={handleSend}
            disabled={!content.trim() || sendDM.isPending || inputDisabled}
            className="gap-2 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0 shrink-0"
            size="icon"
          >
            <PaperPlaneTilt weight="fill" className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
