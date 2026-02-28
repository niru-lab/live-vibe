import { useState, lazy, Suspense, useCallback } from 'react';
import { FilterState } from '@/components/discover/DiscoverFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MagnifyingGlass, Microphone, Camera, Sparkle, ArrowsClockwise } from '@phosphor-icons/react';
import { DiscoverFilters } from '@/components/discover/DiscoverFilters';
import { useQueryClient } from '@tanstack/react-query';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['events'] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Sparkle weight="thin" className="h-5 w-5 text-foreground" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isRefreshing}>
              <ArrowsClockwise weight="thin" className={`h-4 w-4 text-muted-foreground drop-shadow-[0_0_6px_hsl(var(--neon-purple))] ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass weight="thin" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Stuttgart | Techno | Heute..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-20 bg-muted/50 h-11" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Microphone weight="thin" className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Camera weight="thin" className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DiscoverFilters onFiltersChange={(f) => setSelectedCity(f.city)} />
          </div>
        </div>
      </header>
      <div className="flex-1 p-4">
        <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
          <StuttgartMap selectedCity={selectedCity} />
        </Suspense>
      </div>
    </AppLayout>
  );
}
