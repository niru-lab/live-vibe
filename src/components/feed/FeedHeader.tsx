import { MapPin, Bell, Lightning } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const germanCities = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart',
  'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden',
  'Hannover', 'Nürnberg',
];

interface FeedHeaderProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const FeedHeader = ({ selectedCity, onCityChange }: FeedHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0F]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
            <Lightning weight="fill" className="h-4 w-4 text-[#7C3AED]" />
          </div>
          <FeyrnLogo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger className="h-9 w-32 glass-pill text-white">
              <MapPin weight="thin" className="mr-1 h-4 w-4 text-[#A0A0B0]" />
              <SelectValue placeholder="Stadt" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121A] border-white/[0.08]">
              <SelectItem value="all">Alle Städte</SelectItem>
              {germanCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full glass-pill">
            <Bell weight="thin" className="h-4 w-4 text-[#A0A0B0]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] shadow-[0_0_6px_rgba(236,72,153,0.7)]" />
          </Button>
        </div>
      </div>
    </header>
  );
};
