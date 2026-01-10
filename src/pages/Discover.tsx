import { useState, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Map, Grid3X3, Mic, Camera, Sparkles } from 'lucide-react';
import { DiscoverGrid } from '@/components/discover/DiscoverGrid';
import { DiscoverFilters } from '@/components/discover/DiscoverFilters';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="space-y-3 p-4">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Discovery</h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Stuttgart | Techno | Heute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 bg-muted/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter + Toggle Row */}
          <div className="flex items-center justify-between">
            <DiscoverFilters />
            
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as 'grid' | 'map')}
              className="bg-muted/50 p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="grid" 
                aria-label="Grid-Ansicht"
                className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="text-xs font-medium">Grid</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="map" 
                aria-label="Karten-Ansicht"
                className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                <Map className="h-4 w-4" />
                <span className="text-xs font-medium">Karte</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {viewMode === 'grid' ? (
          <DiscoverGrid searchQuery={searchQuery} />
        ) : (
          <div className="p-4">
            <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
              <StuttgartMap />
            </Suspense>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
