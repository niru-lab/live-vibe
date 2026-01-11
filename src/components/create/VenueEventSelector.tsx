import { useState } from 'react';
import { Check, MapPin, Calendar, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useVenues, useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SelectedTag {
  type: 'venue' | 'event';
  id: string;
  name: string;
  imageUrl?: string;
}

interface VenueEventSelectorProps {
  selectedTag: SelectedTag | null;
  onSelect: (tag: SelectedTag | null) => void;
}

export function VenueEventSelector({ selectedTag, onSelect }: VenueEventSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'venues' | 'events'>('venues');

  const { data: venues, isLoading: venuesLoading } = useVenues();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const filteredVenues = (venues || []).filter(v => 
    v.display_name.toLowerCase().includes(search.toLowerCase()) ||
    v.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = (events || []).filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.location_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectVenue = (venue: typeof venues[0]) => {
    onSelect({
      type: 'venue',
      id: venue.id,
      name: venue.display_name,
      imageUrl: venue.avatar_url || undefined,
    });
    setOpen(false);
    setSearch('');
  };

  const handleSelectEvent = (event: typeof events[0]) => {
    onSelect({
      type: 'event',
      id: event.id,
      name: event.name,
      imageUrl: event.cover_image_url || undefined,
    });
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <div className="space-y-2">
      {selectedTag ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/5 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedTag.imageUrl} />
            <AvatarFallback className="bg-gradient-neon text-white">
              {selectedTag.type === 'venue' ? <MapPin className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedTag.name}</p>
            <Badge variant="secondary" className="text-xs">
              {selectedTag.type === 'venue' ? '📍 Venue' : '🎉 Event'}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12 text-muted-foreground"
            >
              <MapPin className="h-4 w-4" />
              Club, Bar oder Event markieren...
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="gradient-text">Venue oder Event markieren</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'venues' | 'events')}>
              <TabsList className="w-full">
                <TabsTrigger value="venues" className="flex-1 gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Venues
                </TabsTrigger>
                <TabsTrigger value="events" className="flex-1 gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="venues" className="max-h-[40vh] overflow-y-auto space-y-2 mt-4">
                {venuesLoading ? (
                  <p className="text-center text-muted-foreground py-4">Lädt...</p>
                ) : filteredVenues.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Keine Venues gefunden</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clubs & Bars mit Profilen erscheinen hier
                    </p>
                  </div>
                ) : (
                  filteredVenues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => handleSelectVenue(venue)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={venue.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-neon text-white">
                          {venue.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{venue.display_name}</p>
                        <p className="text-sm text-muted-foreground truncate">@{venue.username}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {venue.profile_type === 'club' ? '🎧 Club' : '🎤 Organizer'}
                      </Badge>
                    </button>
                  ))
                )}
              </TabsContent>

              <TabsContent value="events" className="max-h-[40vh] overflow-y-auto space-y-2 mt-4">
                {eventsLoading ? (
                  <p className="text-center text-muted-foreground py-4">Lädt...</p>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Keine Events gefunden</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
                        {event.cover_image_url ? (
                          <img src={event.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-neon text-white text-xl">
                            🎉
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {format(new Date(event.starts_at), 'dd. MMM, HH:mm', { locale: de })} • {event.location_name}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-2">
              Dein Post erscheint im Feed des markierten Venues/Events
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export type { SelectedTag };
