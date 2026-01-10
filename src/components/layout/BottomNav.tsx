import { useState } from 'react';
import { Home, Search, PlusCircle, Calendar, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';
import { useUnreadMessageCount } from '@/hooks/useEventMessages';

const navItems = [
  { icon: Home, label: 'Feed', path: '/', emoji: '🏠' },
  { icon: Search, label: 'Discover', path: '/discover', emoji: '🔍' },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true },
  { icon: Calendar, label: 'Events', path: '/events', emoji: '🎉' },
  { icon: MessageCircle, label: 'Messages', path: '/messages', emoji: '💬' },
  { icon: User, label: 'Profil', path: '/profile', emoji: '👤' },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showPostSelector, setShowPostSelector] = useState(false);
  const { data: unreadCount } = useUnreadMessageCount();

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div className="glass rounded-[28px] px-1 py-3 neon-glow-sm">
          <div className="flex items-center justify-around">
            {navItems.map(({ icon: Icon, label, path, isCenter, emoji }) => {
              const isActive = location.pathname === path;
              const hasUnread = path === '/messages' && unreadCount && unreadCount > 0;

              if (isCenter) {
                return (
                  <button
                    key={path}
                    onClick={() => setShowPostSelector(true)}
                    className="relative -mt-8 flex flex-col items-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-neon shadow-lg neon-glow transition-all duration-300 hover:scale-110 active:scale-95">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300',
                    isActive && 'bg-white/10'
                  )}
                >
                  <div className="relative">
                    <span className={cn(
                      "text-xl transition-transform duration-300",
                      isActive && "scale-110"
                    )}>
                      {emoji}
                    </span>
                    {hasUnread && (
                      <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-gradient-neon neon-glow-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <PostTypeSelector
        open={showPostSelector}
        onOpenChange={setShowPostSelector}
      />
    </>
  );
};
