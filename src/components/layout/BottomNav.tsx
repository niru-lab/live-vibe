import { useState } from 'react';
import { Home, Search, PlusCircle, Calendar, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';

const navItems = [
  { icon: Home, label: 'Feed', path: '/', emoji: '🏠' },
  { icon: Search, label: 'Discover', path: '/discover', emoji: '🔍' },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true },
  { icon: Calendar, label: 'Events', path: '/events', emoji: '🎉' },
  { icon: User, label: 'Profil', path: '/profile', emoji: '👤' },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showPostSelector, setShowPostSelector] = useState(false);

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div className="glass rounded-[28px] px-2 py-3 neon-glow-sm">
          <div className="flex items-center justify-around">
            {navItems.map(({ icon: Icon, label, path, isCenter, emoji }) => {
              const isActive = location.pathname === path;

              if (isCenter) {
                return (
                  <button
                    key={path}
                    onClick={() => setShowPostSelector(true)}
                    className="relative -mt-8 flex flex-col items-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon shadow-lg neon-glow transition-all duration-300 hover:scale-110 active:scale-95">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300',
                    isActive && 'bg-white/10'
                  )}
                >
                  <span className={cn(
                    "text-2xl transition-transform duration-300",
                    isActive && "scale-110"
                  )}>
                    {emoji}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 h-1 w-8 rounded-full bg-gradient-neon neon-glow-sm" />
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
