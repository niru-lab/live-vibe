import { MapPin, Bell, Lightning } from '@phosphor-icons/react';
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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightning weight="thin" className="h-6 w-6 text-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger className="h-9 w-32 border-border/50 bg-muted/50">
              <MapPin weight="thin" className="mr-1 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Stadt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Städte</SelectItem>
              {germanCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="relative">
            <Bell weight="thin" className="h-5 w-5 text-muted-foreground drop-shadow-[0_0_6px_hsl(var(--neon-purple))]" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent))]" />
          </Button>
        </div>
      </div>
    </header>
  );
};
