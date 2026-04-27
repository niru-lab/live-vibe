import { useState, lazy, Suspense, useCallback } from 'react';
import { FilterState } from '@/components/discover/DiscoverFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MagnifyingGlass, Microphone, Camera, Compass, ArrowsClockwise } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { DiscoverFilters } from '@/components/discover/DiscoverFilters';
import { useQueryClient } from '@tanstack/react-query';

const StuttgartMap = lazy(() => import('@/components/maps/StuttgartMap').then(m => ({ default: m.StuttgartMap })));

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['events'] });
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  return (
    <AppLayout>
      <div className="fixed inset-0 flex flex-col">
        <header className="z-40 border-b border-white/[0.08] bg-[#0A0A0F]/95 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full glass-pill">
                  <Compass weight="fill" className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <FeyrnLogo size="sm" />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill" onClick={handleRefresh} disabled={isRefreshing}>
                <ArrowsClockwise weight="thin" className={`h-4 w-4 text-[#A0A0B0] ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass weight="thin" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0A0B0]" />
                <Input placeholder="Stuttgart | Techno | Heute..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-20 glass-pill border-0 h-11 text-white placeholder:text-[#A0A0B0]" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Microphone weight="thin" className="h-4 w-4 text-[#A0A0B0]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Camera weight="thin" className="h-4 w-4 text-[#A0A0B0]" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DiscoverFilters onFiltersChange={(f) => {
                setSelectedCity(f.city);
                const catMap: Record<string, string> = { 'Bar': 'bar', 'Club': 'club', 'Café': 'cafe', 'Events': 'event' };
                setSelectedCategory(f.category ? catMap[f.category] || null : null);
              }} />
            </div>
          </div>
        </header>
        <div className="relative flex-1 min-h-0">
          <Suspense fallback={<Skeleton className="absolute inset-0 rounded-none" />}>
            <div className="absolute inset-0">
              <StuttgartMap selectedCity={selectedCity} selectedCategory={selectedCategory} searchQuery={searchQuery} />
            </div>
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
