import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNotifications, NotificationRow } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { BellSlash } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationDrawer = ({ open, onOpenChange }: Props) => {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const handleSelect = (n: NotificationRow) => {
    if (!n.is_read) markRead.mutate(n.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-white/10 bg-[#0A0A0F]/95 backdrop-blur-xl p-0"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-white/10 px-4 py-4">
          <SheetTitle className="text-white text-base font-semibold">Benachrichtigungen</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="h-8 text-xs text-muted-foreground hover:text-white"
            >
              Alle gelesen
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-64px)]">
          <div className="space-y-2 p-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                  <BellSlash weight="thin" className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onSelect={handleSelect} />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
