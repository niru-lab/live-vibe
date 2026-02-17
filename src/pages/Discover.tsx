import { useState, lazy, Suspense, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Mic, Camera, Sparkles, RefreshCw } from 'lucide-react';
import { DiscoverFilters } from '@/components/discover/DiscoverFilters';
import { useQueryClient } from '@tanstack/react-query';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['events'] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="space-y-3 p-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Stuttgart | Techno | Heute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 bg-muted/50 h-11"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3">
            <DiscoverFilters />
          </div>
        </div>
      </header>

      {/* Map Content */}
      <div className="flex-1 p-4">
        <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
          <StuttgartMap />
        </Suspense>
      </div>
    </AppLayout>
  );
}
