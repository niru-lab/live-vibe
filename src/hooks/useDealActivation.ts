import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivateOffer } from '@/hooks/useVenueOffers';
import { claimErrorMessage, type VenueOffer } from '@/lib/offers';
import { track, type RsvpSurface } from '@/lib/analytics';

/** Activation flow shared by every place a ticket is shown. */
export const useDealActivation = (surface: RsvpSurface) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activate = useActivateOffer();

  const start = (offer: VenueOffer) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    activate.mutate(offer.id, {
      onSuccess: (res) => {
        track('offer_activated', { offerId: offer.id, venueId: offer.venue_id, eventId: offer.event_id ?? undefined, surface });
        toast.success('Deal aktiviert 🎟️', { description: 'Dein QR-Code liegt jetzt in deinen Deals.' });
        navigate(`/deals?focus=${res.activation_id}`);
      },
      onError: (e) => toast.error(claimErrorMessage(e instanceof Error ? e.message : String(e))),
    });
  };

  return { start, pendingId: activate.isPending ? activate.variables : undefined };
};
