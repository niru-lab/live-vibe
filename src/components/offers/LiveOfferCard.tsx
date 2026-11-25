import { useEffect } from 'react';
import { isOfferLive, type VenueOffer } from '@/lib/offers';
import { track, type RsvpSurface } from '@/lib/analytics';
import { DealTicketList } from './VenueDealsList';

interface LiveOfferListProps {
  offers: VenueOffer[] | undefined;
  surface: RsvpSurface;
  compact?: boolean;
}

const Impressions = ({ offers, surface }: { offers: VenueOffer[]; surface: RsvpSurface }) => {
  const key = offers.map((o) => o.id).join(',');
  useEffect(() => {
    offers.forEach((o) => track('offer_impression', { offerId: o.id, venueId: o.venue_id, eventId: o.event_id ?? undefined, surface }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, surface]);
  return null;
};

/**
 * Live deals as tickets (map sheet, venue page, event page).
 * Renders nothing when there is no live deal — never an empty section.
 */
export const LiveOfferList = ({ offers, surface, compact }: LiveOfferListProps) => {
  const live = (offers ?? []).filter((o) => isOfferLive(o));
  if (live.length === 0) return null;
  return (
    <>
      <Impressions offers={live} surface={surface} />
      <DealTicketList offers={live} surface={surface} compact={compact} />
    </>
  );
};

/** Single live deal as a ticket (kept for existing callers). */
export const LiveOfferCard = ({ offer, surface, compact }: { offer: VenueOffer; surface: RsvpSurface; compact?: boolean }) => (
  <LiveOfferList offers={[offer]} surface={surface} compact={compact} />
);
