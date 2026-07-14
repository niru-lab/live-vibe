import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Prohibit, EyeSlash, MagnifyingGlass, ChatCircleSlash, Bell } from '@phosphor-icons/react';
import { useBlockUser } from '@/hooks/useBlockUser';

interface BlockSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: {
    id: string;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  onBlocked?: () => void;
}

/**
 * New modern bottom-sheet block confirmation.
 * Deliberately not the old AlertDialog pattern — separate visual language
 * for safety actions.
 */
export const BlockSheet = ({ open, onOpenChange, target, onBlocked }: BlockSheetProps) => {
  const block = useBlockUser();
  const [confirmArmed, setConfirmArmed] = useState(false);

  const handleClose = (v: boolean) => {
    if (!v) setConfirmArmed(false);
    onOpenChange(v);
  };

  const handleBlock = async () => {
    if (!target) return;
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    try {
      await block.mutateAsync(target.id);
      handleClose(false);
      onBlocked?.();
    } catch {
      /* toast handled in hook */
    }
  };

  if (!target) return null;

  const displayName = target.display_name || target.username;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-white/[0.06] bg-background/95 backdrop-blur-xl p-0 max-h-[92vh]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/15" />

        <div className="px-6 pt-5 pb-2 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={target.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="bg-muted text-lg font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-destructive/90 border-2 border-background flex items-center justify-center">
              <Prohibit weight="bold" className="h-3.5 w-3.5 text-destructive-foreground" />
            </div>
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            @{target.username} blockieren?
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {displayName} wird nicht benachrichtigt.
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          {[
            { icon: EyeSlash, text: 'Ihr seht keine Beiträge, Kommentare oder Likes voneinander' },
            { icon: MagnifyingGlass, text: `@${target.username} kann dich nicht mehr in der Suche finden` },
            { icon: ChatCircleSlash, text: 'Direktnachrichten sind nicht mehr möglich' },
            { icon: Bell, text: 'Keine Benachrichtigungen mehr von diesem Nutzer' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Icon weight="thin" className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/90 pt-1.5">{text}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-8 pt-2 space-y-2">
          <Button
            onClick={handleBlock}
            disabled={block.isPending}
            className={`w-full h-12 rounded-2xl font-semibold transition-all ${
              confirmArmed
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30'
            }`}
          >
            {block.isPending
              ? 'Blockiere…'
              : confirmArmed
              ? `Ja, @${target.username} blockieren`
              : 'Blockieren'}
          </Button>
          <Button
            variant="ghost"
            className="w-full h-11 rounded-2xl"
            onClick={() => handleClose(false)}
            disabled={block.isPending}
          >
            Abbrechen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
