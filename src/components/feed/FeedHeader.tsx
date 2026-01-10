import { MapPin, Bell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const germanCities = [
  'Berlin',
  'Hamburg',
  'München',
  'Köln',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Bremen',
  'Dresden',
  'Hannover',
  'Nürnberg',
];

interface FeedHeaderProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const FeedHeader = ({ selectedCity, onCityChange }: FeedHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Feyrn
          </span>
        </div>

        {/* City selector */}
        <div className="flex items-center gap-2">
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger className="h-9 w-32 border-border/50 bg-muted/50">
              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Stadt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle Städte</SelectItem>
              {germanCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
          </Button>
        </div>
      </div>
    </header>
  );
};
