import { useState } from 'react';
import { Home, Search, PlusCircle, Calendar, Gem } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PostTypeSelector } from '@/components/create/PostTypeSelector';

const navItems = [
  { icon: Home, label: 'Feed', path: '/', emoji: '🏠' },
  { icon: Search, label: 'Discovery', path: '/discover', emoji: '🔍' },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true },
  { icon: Calendar, label: 'Events', path: '/events', emoji: '🎉' },
  { icon: Gem, label: 'Profil', path: '/profile', emoji: '💎' },
];

export const BottomNav = () => {
  const location = useLocation();
  const [showPostSelector, setShowPostSelector] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl safe-area-pb">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          {navItems.map(({ icon: Icon, label, path, isCenter, emoji }) => {
            const isActive = location.pathname === path;

            if (isCenter) {
              return (
                <button
                  key={path}
                  onClick={() => setShowPostSelector(true)}
                  className="relative -mt-6 flex flex-col items-center transition-all duration-200"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 transition-transform hover:scale-110 active:scale-95">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200',
                  isActive && 'scale-105'
                )}
              >
                <span className="text-lg">{emoji}</span>
                <span
                  className={cn(
                    'text-[10px] font-semibold transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
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
      </nav>

      <PostTypeSelector
        open={showPostSelector}
        onOpenChange={setShowPostSelector}
      />
    </>
  );
};