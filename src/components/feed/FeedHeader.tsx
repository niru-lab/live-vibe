import { Lightning } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { UserSearchBar } from './UserSearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface FeedHeaderProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const FeedHeader = ({ selectedCity, onCityChange }: FeedHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
            <Lightning weight="fill" className="h-4 w-4 text-primary" />
          </div>
          <FeyrnLogo size="sm" />
        </div>

        <UserSearchBar />

        <NotificationBell />
      </div>
    </header>
  );
};
