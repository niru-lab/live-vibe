import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { useSendDM, useDirectMessages } from '@/hooks/useDirectMessages';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useMemo(() => {
    const real = (allDms || []).filter(
      (m) =>
        (m.sender_id === recipient.id && m.recipient_id === myProfile?.id) ||
        (m.recipient_id === recipient.id && m.sender_id === myProfile?.id),
    );
    // remove optimistic ones already present in real
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="chat-container"
        className="bg-[#12121A] border-white/[0.08] text-white max-w-md flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <DialogTitle className="text-white flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={recipient.avatar_url || ''} />
              <AvatarFallback className="bg-[#1A1A24] text-white text-xs">
                {recipient.display_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{recipient.display_name}</p>
              <p className="text-[11px] text-[#A0A0B0] font-normal">@{recipient.username}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="px-5 py-3 max-h-[40vh] min-h-[180px] overflow-y-auto flex flex-col gap-2"
        >
          {conversation.length === 0 ? (
            <p className="text-xs text-[#A0A0B0] text-center py-6">Noch keine Nachrichten</p>
          ) : (
            conversation.map((m: any) => {
              const isMine = m.sender_id === myProfile?.id;
              return (
                <div
                  key={m.id}
                  data-testid={isMine ? 'chat-message-sent' : 'chat-message-received'}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? 'self-end bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white'
                      : 'self-start bg-white/[0.06] text-white'
                  }`}
                >
                  <span data-testid="chat-message">{m.content}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] flex items-end gap-2">
          <Textarea
            data-testid="chat-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nachricht…"
            className="min-h-[44px] max-h-[120px] bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-[#A0A0B0] resize-none"
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
            disabled={!content.trim() || sendDM.isPending}
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
