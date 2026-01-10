import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/events/EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Calendar, Filter, Sparkles, Map, List } from 'lucide-react';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

const categories = [
  { value: 'all', label: 'Alle' },
  { value: 'club', label: '🎧 Club' },
  { value: 'house_party', label: '🏠 Hausparty' },
  { value: 'bar', label: '🍸 Bar' },
  { value: 'festival', label: '🎪 Festival' },
  { value: 'concert', label: '🎤 Konzert' },
  { value: 'other', label: '✨ Andere' },
];

const germanCities = [
  'Berlin',
  'Hamburg',
  'München',
  'Köln',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
];

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: events, isLoading } = useEvents({
    city: selectedCity === 'all' ? undefined : selectedCity,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const filteredEvents = events?.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Entdecken</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Events, Clubs, Locations suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-9 flex-1">
                <MapPin className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Stadt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Städte</SelectItem>
                {germanCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 flex-1">
                <Filter className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              🔥 Heute Abend
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              🎉 Wochenende
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              💎 Top Events
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              📍 In der Nähe
            </Badge>
          </div>
        </div>
      </header>

      {/* Content Tabs */}
      <Tabs defaultValue="map" className="flex-1">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Karte
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <List className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="map" className="mt-0 p-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
            <StuttgartMap />
          </Suspense>
        </TabsContent>

        <TabsContent value="events" className="mt-0 p-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Keine Events gefunden
              </h2>
              <p className="mb-6 max-w-xs text-muted-foreground">
                Ändere deine Filter oder erstelle selbst ein Event!
              </p>
              <Button
                onClick={() => navigate('/events/create')}
                className="bg-gradient-to-r from-primary to-accent"
              >
                Event erstellen
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
