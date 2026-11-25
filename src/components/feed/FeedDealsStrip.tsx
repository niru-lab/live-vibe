import { useFeedLiveDeals } from '@/hooks/useVenueOffers';
import { DealTicketList } from '@/components/offers/VenueDealsList';

/** "🔥 Live-Deals" at the top of the feed: running deals of venues the user follows. Hidden when there are none. */
export const FeedDealsStrip = () => {
  const { data: deals } = useFeedLiveDeals();
  if (!deals || deals.length === 0) return null;
  return (
    <section className="mb-4" aria-label="Live-Deals" data-testid="feed-deals-strip">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">🔥 Live-Deals deiner Spots</p>
      <div className="-mx-[14px] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[14px] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {deals.map((d) => (
          <div key={d.id} className="w-[86%] max-w-sm shrink-0 snap-start">
            <DealTicketList offers={[d]} surface="feed" compact />
          </div>
        ))}
      </div>
    </section>
  );
};
