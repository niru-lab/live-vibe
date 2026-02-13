import { useState } from 'react';
import { Home, Search, PlusCircle, Calendar, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';

const navItems = [
  { icon: Home, label: 'Feed', path: '/', emoji: '🏠', badgeKey: null },
  { icon: Search, label: 'Discover', path: '/discover', emoji: '🔍', badgeKey: null },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true, badgeKey: null },
  { icon: Calendar, label: 'Events', path: '/events', emoji: '🎉', badgeKey: 'events' as const },
  { icon: MessageCircle, label: 'Messages', path: '/messages', emoji: '💬', badgeKey: 'messages' as const },
  { icon: User, label: 'Profil', path: '/profile', emoji: '👤', badgeKey: 'profile' as const },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showPostSelector, setShowPostSelector] = useState(false);
  const { eventBadge, messagesBadge, profileBadge } = useNotificationBadges();

  const getBadgeCount = (key: string | null): number => {
    if (!key) return 0;
    if (key === 'events') return eventBadge;
    if (key === 'messages') return messagesBadge;
    if (key === 'profile') return profileBadge;
    return 0;
  };

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div className="glass rounded-[28px] px-1 py-3 neon-glow-sm">
          <div className="flex items-center justify-around">
            {navItems.map(({ icon: Icon, label, path, isCenter, emoji, badgeKey }) => {
              const isActive = location.pathname === path;
              const badgeCount = getBadgeCount(badgeKey);

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
                    {badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white animate-pulse">
                        {badgeCount > 99 ? '99+' : badgeCount}
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
