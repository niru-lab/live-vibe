import { useNavigate } from 'react-router-dom';
import { Ticket } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyOfferActivations, useOffersRemaining, useVenueDeals } from '@/hooks/useVenueOffers';
import { useDealActivation } from '@/hooks/useDealActivation';
import type { VenueOffer } from '@/lib/offers';
import type { RsvpSurface } from '@/lib/analytics';
import { DealTicket } from './DealTicket';

interface DealTicketListProps {
  offers: VenueOffer[];
  surface: RsvpSurface;
  venueName?: string | null;
  /** Owner's own view: tickets without buttons. */
  readOnly?: boolean;
  compact?: boolean;
}

export const DealTicketList = ({ offers, surface, venueName, readOnly, compact }: DealTicketListProps) => {
  const navigate = useNavigate();
  const ids = offers.map((o) => o.id);
  const { data: remaining } = useOffersRemaining(ids);
  const { data: mine } = useMyOfferActivations(readOnly ? [] : ids);
  const { start, pendingId } = useDealActivation(surface);

  return (
    <div className="space-y-3">
      {offers.map((o) => {
        const my = mine?.[o.id];
        return (
          <DealTicket
            key={o.id}
            offer={o}
            venueName={venueName}
            remaining={remaining?.[o.id]}
            compact={compact}
            preview={readOnly}
            state={my === 'redeemed' ? 'redeemed' : my === 'active' ? 'activated' : 'open'}
            busy={pendingId === o.id}
            onActivate={() => start(o)}
            onOpenWallet={() => navigate('/deals')}
          />
        );
      })}
    </div>
  );
};

interface VenueDealsListProps {
  venueId: string | undefined;
  venueName?: string | null;
  readOnly?: boolean;
}

/** "Deals" tab of a venue profile: everything running now or starting within 12 h. Public. */
export const VenueDealsList = ({ venueId, venueName, readOnly }: VenueDealsListProps) => {
  const { data: offers, isLoading } = useVenueDeals(venueId);
  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (!offers || offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="venue-deals-empty">
        <Ticket weight="thin" className="mb-2 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {readOnly ? 'Gerade läuft kein Deal. Erstell einen über das +.' : 'Gerade keine Deals – aktiviere die Glocke 🔔, dann verpasst du keinen.'}
        </p>
      </div>
    );
  }
  return <DealTicketList offers={offers} surface="venue_profile" venueName={venueName} readOnly={readOnly} />;
};
