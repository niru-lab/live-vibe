import { useState } from 'react';
import { House, MagnifyingGlass, PlusCircle, CalendarBlank, User, ChatCircle } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';

const navItems = [
  { icon: House, label: 'Feed', path: '/', badgeKey: null },
  { icon: MagnifyingGlass, label: 'Discover', path: '/discover', badgeKey: null },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true, badgeKey: null },
  { icon: CalendarBlank, label: 'Events', path: '/events', badgeKey: 'events' as const },
  { icon: ChatCircle, label: 'Messages', path: '/messages', badgeKey: 'messages' as const },
  { icon: User, label: 'Profil', path: '/profile', badgeKey: 'profile' as const },
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
            {navItems.map(({ icon: Icon, label, path, isCenter, badgeKey }) => {
              const isActive = location.pathname === path;
              const badgeCount = getBadgeCount(badgeKey);

              if (isCenter) {
                return (
                  <button
                    key={path}
                    onClick={() => setShowPostSelector(true)}
                    className="relative -mt-8 flex flex-col items-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-foreground/20 bg-background shadow-lg transition-all duration-300 hover:scale-110 active:scale-95">
                      <Icon weight="thin" className="h-7 w-7 text-foreground" />
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
                    <Icon
                      weight={isActive ? 'fill' : 'thin'}
                      className={cn(
                        'h-6 w-6 transition-all duration-300',
                        isActive ? 'text-white' : 'text-muted-foreground'
                      )}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      isActive ? 'text-white' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-white" />
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
