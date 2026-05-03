import { useState } from 'react';
import { House, MagnifyingGlass, PlusCircle, CalendarBlank, User } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';

const navItems = [
  { icon: House, label: 'Feed', path: '/', badgeKey: null },
  { icon: MagnifyingGlass, label: 'Discover', path: '/discover', badgeKey: null },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true, badgeKey: null },
  { icon: CalendarBlank, label: 'Events', path: '/events', badgeKey: 'events' as const },
  { icon: User, label: 'Profil', path: '/profile', badgeKey: 'profile' as const },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      <nav
        className="fixed left-4 right-4 z-50 mx-auto max-w-md"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="glass-pill rounded-[28px] px-1 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-around">
            {navItems.map(({ icon: Icon, label, path, isCenter, badgeKey }) => {
              const isActive = location.pathname === path;
              const badgeCount = getBadgeCount(badgeKey);

              if (isCenter) {
                let pressTimer: ReturnType<typeof setTimeout> | null = null;
                return (
                  <button
                    key={path}
                    data-testid="create-post-btn"
                    onClick={() => navigate('/create')}
                    onPointerDown={() => { pressTimer = setTimeout(() => setShowPostSelector(true), 450); }}
                    onPointerUp={() => { if (pressTimer) clearTimeout(pressTimer); }}
                    onPointerLeave={() => { if (pressTimer) clearTimeout(pressTimer); }}
                    onContextMenu={(e) => { e.preventDefault(); setShowPostSelector(true); }}
                    className="relative -mt-8 flex flex-col items-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 active:scale-95">
                      <Icon weight="bold" className="h-7 w-7" />
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={path}
                  to={path}
                  data-testid={path === '/discover' ? 'nav-map' : path === '/' ? 'nav-feed' : path === '/events' ? 'nav-events' : path === '/profile' ? 'nav-profile' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all duration-300'
                  )}
                >
                  <div className="relative">
                    <Icon
                      weight={isActive ? 'fill' : 'thin'}
                      className={cn(
                        'h-5 w-5 transition-all duration-300',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-xs font-bold text-primary-foreground">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs transition-colors',
                      isActive ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-primary" />
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
