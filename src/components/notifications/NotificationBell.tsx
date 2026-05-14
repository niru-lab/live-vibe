import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDrawer } from './NotificationDrawer';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const display = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Benachrichtigungen"
        className="relative h-9 w-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 shrink-0"
      >
        <Bell className="h-4 w-4 text-white" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-[10px] font-semibold text-white flex items-center justify-center shadow-lg">
            {display}
          </span>
        )}
      </Button>
      <NotificationDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};
