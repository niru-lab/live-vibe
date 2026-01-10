import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Filter, Music, Users, Clock, DollarSign, X } from 'lucide-react';

interface DiscoverFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

export interface FilterState {
  music: string | null;
  vibes: string | null;
  time: string | null;
  price: string | null;
}

const musicOptions = ['Alle', 'Techno', 'House', 'Hip-Hop', 'Latin', 'Pop', 'Mixed'];
const vibesOptions = ['Alle', 'Wild', 'Chill', 'Romantic', 'Underground', 'Mainstream'];
const timeOptions = ['Alle', 'Jetzt', 'Heute', 'Morgen', 'Wochenende'];
const priceOptions = ['Alle', 'Kostenlos', '< 10€', '< 20€', '< 50€'];

export function DiscoverFilters({ onFiltersChange }: DiscoverFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    music: null,
    vibes: null,
    time: null,
    price: null,
  });

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'Alle').length;

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value === 'Alle' ? null : value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const cleared = { music: null, vibes: null, time: null, price: null };
    setFilters(cleared);
    onFiltersChange?.(cleared);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Filter</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="mr-1 h-4 w-4" />
                Zurücksetzen
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-8">
          {/* Music Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Music className="h-4 w-4 text-primary" />
              Musik
            </div>
            <div className="flex flex-wrap gap-2">
              {musicOptions.map((option) => (
                <Badge
                  key={option}
                  variant={filters.music === option || (!filters.music && option === 'Alle') ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => updateFilter('music', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Vibes Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Vibes
            </div>
            <div className="flex flex-wrap gap-2">
              {vibesOptions.map((option) => (
                <Badge
                  key={option}
                  variant={filters.vibes === option || (!filters.vibes && option === 'Alle') ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => updateFilter('vibes', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              Zeit
            </div>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((option) => (
                <Badge
                  key={option}
                  variant={filters.time === option || (!filters.time && option === 'Alle') ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => updateFilter('time', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4 text-primary" />
              Preis
            </div>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((option) => (
                <Badge
                  key={option}
                  variant={filters.price === option || (!filters.price && option === 'Alle') ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => updateFilter('price', option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <Button 
            className="w-full bg-gradient-to-r from-primary to-accent"
            onClick={() => setOpen(false)}
          >
            {activeFiltersCount > 0 
              ? `${activeFiltersCount} Filter anwenden` 
              : 'Ergebnisse anzeigen'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
