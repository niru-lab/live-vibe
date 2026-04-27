import { Bell, Lightning } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { Button } from '@/components/ui/button';
import { UserSearchBar } from './UserSearchBar';

interface FeedHeaderProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const FeedHeader = ({ selectedCity, onCityChange }: FeedHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0F]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
            <Lightning weight="fill" className="h-4 w-4 text-[#7C3AED]" />
          </div>
          <FeyrnLogo size="sm" />
        </div>

        <UserSearchBar />

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full glass-pill shrink-0">
          <Bell weight="thin" className="h-4 w-4 text-[#A0A0B0]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] shadow-[0_0_6px_rgba(236,72,153,0.7)]" />
        </Button>
      </div>
    </header>
  );
};
