import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Funnel, MusicNote, Users, Clock, CurrencyDollar, MapPin, Star, X, Buildings } from '@phosphor-icons/react';

interface DiscoverFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

export interface FilterState {
  city: string | null;
  music: string | null;
  vibes: string | null;
  time: string | null;
  price: string | null;
  radius: string | null;
  socialCloud: string | null;
}

const cityOptions = ['Alle', 'Stuttgart', 'Aalen (BW)', 'Frankfurt am Main'];
const musicOptions = ['Alle', 'Techno', 'House', 'Hip-Hop', 'Latin', 'Pop', 'Mixed'];
const vibesOptions = ['Alle', 'Wild', 'Casual', 'Exklusiv', 'Chill', 'Underground'];
const timeOptions = ['Alle', 'Jetzt', 'Heute', 'Morgen', 'Wochenende'];
const priceOptions = ['Alle', 'Kostenlos', '< 10€', '< 20€', '< 50€'];
const radiusOptions = ['Alle', '500m', '2km', '5km', 'Stadt'];
const socialCloudOptions = ['Alle', 'Top 10', 'Top 50', 'Top 100'];

export function DiscoverFilters({ onFiltersChange }: DiscoverFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    city: null,
    music: null,
    vibes: null,
    time: null,
    price: null,
    radius: null,
    socialCloud: null,
  });

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'Alle').length;

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value === 'Alle' ? null : value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    const cleared: FilterState = { 
      city: null,
      music: null, 
      vibes: null, 
      time: null, 
      price: null, 
      radius: null, 
      socialCloud: null 
    };
    setFilters(cleared);
    onFiltersChange?.(cleared);
  };

  const FilterSection = ({ 
    icon: Icon, 
    label, 
    options, 
    filterKey 
  }: { 
    icon: any; 
    label: string; 
    options: string[]; 
    filterKey: keyof FilterState;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon weight="thin" className="h-4 w-4" />
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option}
            variant={filters[filterKey] === option || (!filters[filterKey] && option === 'Alle') ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1.5 transition-all hover:scale-105 active:scale-95"
            onClick={() => updateFilter(filterKey, option)}
          >
            {option}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative gap-2 bg-muted/50"
        >
          <Funnel weight="thin" className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">🎛️ Filter</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X weight="thin" className="mr-1 h-4 w-4" />
                Zurücksetzen
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Finde genau das, was du suchst
          </p>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-24 pr-2">
          <FilterSection icon={Buildings} label="🏙️ Stadt" options={cityOptions} filterKey="city" />
          <FilterSection icon={MusicNote} label="🎵 Musik" options={musicOptions} filterKey="music" />
          <FilterSection icon={Users} label="👥 Vibes" options={vibesOptions} filterKey="vibes" />
          <FilterSection icon={Clock} label="⏰ Zeit" options={timeOptions} filterKey="time" />
          <FilterSection icon={CurrencyDollar} label="💰 Preis" options={priceOptions} filterKey="price" />
          <FilterSection icon={MapPin} label="📍 Radius" options={radiusOptions} filterKey="radius" />
          <FilterSection icon={Star} label="⭐ Social Cloud" options={socialCloudOptions} filterKey="socialCloud" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-xl p-4 safe-area-pb">
          <Button 
            className="w-full text-lg font-semibold h-12"
            onClick={() => setOpen(false)}
          >
            {activeFiltersCount > 0 
              ? `🔥 ${activeFiltersCount} Filter anwenden` 
              : '✨ Ergebnisse anzeigen'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
