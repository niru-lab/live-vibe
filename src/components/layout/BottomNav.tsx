import { Home, Search, PlusCircle, Calendar, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: PlusCircle, label: 'Post', path: '/create', isCenter: true },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map(({ icon: Icon, label, path, isCenter }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isCenter && "relative -mt-6"
              )}
            >
              {isCenter ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent shadow-neon-purple transition-transform hover:scale-110">
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
