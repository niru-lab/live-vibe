import { useState } from 'react';
import { MapPin, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useVenues } from '@/hooks/useEvents';

export interface PickedLocation {
  venue_id?: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  selected: PickedLocation | null;
  onSelect: (loc: PickedLocation | null) => void;
}

// City fallback coords for free-text matches
const CITY_COORDS: Record<string, [number, number]> = {
  stuttgart: [48.7758, 9.1829],
  berlin: [52.5200, 13.4050],
  münchen: [48.1351, 11.5820],
  munich: [48.1351, 11.5820],
  hamburg: [53.5511, 9.9937],
  köln: [50.9375, 6.9603],
  frankfurt: [50.1109, 8.6821],
  aalen: [48.8378, 10.0933],
};

export function LocationPicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: venues } = useVenues();

  const q = search.toLowerCase().trim();
  const venueMatches = (venues || []).filter(v =>
    !q || v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q) || (v.city || '').toLowerCase().includes(q)
  ).slice(0, 8);

  const cityMatch = q
    ? Object.entries(CITY_COORDS).find(([city]) => q.includes(city) || city.includes(q))
    : null;

  const pickVenue = (v: NonNullable<typeof venues>[number]) => {
    onSelect({ venue_id: v.id, name: v.name, address: v.address, latitude: v.latitude, longitude: v.longitude });
    setOpen(false);
    setSearch('');
  };

  const pickCity = () => {
    if (!cityMatch) return;
    const [city, [lat, lng]] = cityMatch;
    onSelect({ name: search.trim() || city, latitude: lat, longitude: lng });
    setOpen(false);
    setSearch('');
  };

  if (selected) {
    return (
      <div
        data-testid="selected-location"
        className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/5 p-3"
      >
        <MapPin weight="fill" className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{selected.name}</p>
          {selected.address && <p className="text-xs text-muted-foreground truncate">{selected.address}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onSelect(null)} aria-label="Location entfernen">
          <X weight="thin" className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid="location-picker"
          variant="outline"
          className="w-full justify-start gap-2 h-12 text-muted-foreground"
        >
          <MapPin weight="thin" className="h-4 w-4" />
          Location hinzufügen…
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="gradient-text">Location wählen</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <MagnifyingGlass weight="thin" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="location-search-input"
            autoFocus
            placeholder="Venue oder Stadt suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto space-y-1 mt-2">
          {venueMatches.map((v) => (
            <button
              key={v.id}
              data-testid="location-suggestion"
              onClick={() => pickVenue(v)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <MapPin weight="thin" className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{v.name}</p>
                <p className="text-xs text-muted-foreground truncate">{v.address}</p>
              </div>
            </button>
          ))}
          {cityMatch && (
            <button
              data-testid="location-suggestion"
              onClick={pickCity}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <MapPin weight="thin" className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate capitalize">{search || cityMatch[0]}</p>
                <p className="text-xs text-muted-foreground">Stadt-Mittelpunkt verwenden</p>
              </div>
            </button>
          )}
          {q && venueMatches.length === 0 && !cityMatch && (
            <p className="text-center text-sm text-muted-foreground py-6">Keine Treffer</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
