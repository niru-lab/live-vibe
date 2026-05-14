import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { NotificationRow, } from '@/hooks/useNotifications';
import { notificationText, notificationHref, relativeTime } from '@/lib/notificationHelpers';

interface Props {
  notification: NotificationRow;
  onSelect: (n: NotificationRow) => void;
}

export const NotificationItem = ({ notification, onSelect }: Props) => {
  const username = notification.actor?.display_name || notification.actor?.username || 'Jemand';
  const href = notificationHref(notification);
  const text = notificationText(notification.type, username);
  const unread = !notification.is_read;

  return (
    <Link
      to={href}
      onClick={() => onSelect(notification)}
      className={cn(
        'relative flex items-start gap-3 rounded-2xl p-3 transition-colors',
        'border border-white/10 bg-white/5 backdrop-blur-xl',
        unread && 'bg-[hsl(265_84%_58%/0.10)] border-l-2 border-l-transparent',
      )}
      style={
        unread
          ? { borderLeft: '2px solid transparent', backgroundImage: 'linear-gradient(#12121A,#12121A), linear-gradient(135deg,#7C3AED,#EC4899)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }
          : undefined
      }
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={notification.actor?.avatar_url || undefined} />
        <AvatarFallback className="bg-white/10 text-white text-xs">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground leading-snug">{text}</p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{notification.body}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(notification.created_at)}</p>
      </div>
      {unread && <span className="mt-2 h-2 w-2 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899]" />}
    </Link>
  );
};
