import { useState, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
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
import { Search, MapPin, Sparkles, Map, Grid3X3 } from 'lucide-react';
import { DiscoverGrid } from '@/components/discover/DiscoverGrid';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

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
              placeholder="User, Clubs, Events suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* City Filter */}
          <div className="flex gap-2">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-9 w-full">
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
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              🔥 Trending
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              🎧 Clubs
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              👤 User
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground"
            >
              🎉 Events
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
      <Tabs defaultValue="grid" className="flex-1">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Entdecken
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Karte
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-0 pt-2">
          <DiscoverGrid />
        </TabsContent>

        <TabsContent value="map" className="mt-0 p-4">
          <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
            <StuttgartMap />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}