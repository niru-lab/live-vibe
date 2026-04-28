import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { useSendDM } from '@/hooks/useDirectMessages';
import { toast } from '@/hooks/use-toast';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: { id: string; username: string; display_name: string; avatar_url: string | null };
}

export function SendMessageDialog({ open, onOpenChange, recipient }: SendMessageDialogProps) {
  const [content, setContent] = useState('');
  const sendDM = useSendDM();

  const handleSend = async () => {
    if (!content.trim()) return;
    try {
      await sendDM.mutateAsync({ recipientId: recipient.id, content: content.trim() });
      toast({ title: 'Nachricht gesendet', description: `An @${recipient.username}` });
      setContent('');
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message || 'Konnte nicht senden', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nachricht senden</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipient.avatar_url || ''} />
            <AvatarFallback className="bg-[#1A1A24] text-white">{recipient.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-white">{recipient.display_name}</p>
            <p className="text-xs text-[#A0A0B0]">@{recipient.username}</p>
          </div>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schreibe eine Nachricht..."
          className="min-h-[120px] bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-[#A0A0B0] resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#A0A0B0]">{content.length}/500</span>
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sendDM.isPending}
            className="gap-2 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white border-0"
          >
            <PaperPlaneTilt weight="fill" className="h-4 w-4" />
            Senden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
