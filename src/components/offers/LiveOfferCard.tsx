import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Clock, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useActivateOffer, useMyOfferActivations } from '@/hooks/useVenueOffers';
import { formatValidity, isOfferLive, offerBadgeText, type VenueOffer } from '@/lib/offers';
import { track, type RsvpSurface } from '@/lib/analytics';

interface LiveOfferCardProps {
  offer: VenueOffer;
  surface: RsvpSurface;
  compact?: boolean;
}

/**
 * Public-facing live offer card. Only rendered for offers that are actually
 * live — the caller filters, and this component re-checks defensively.
 */
export const LiveOfferCard = ({ offer, surface, compact }: LiveOfferCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: activations } = useMyOfferActivations([offer.id]);
  const activate = useActivateOffer();
  const isActivated = activations?.[offer.id] === 'active';

  useEffect(() => {
    track('offer_impression', { offerId: offer.id, venueId: offer.venue_id, eventId: offer.event_id ?? undefined, surface });
  }, [offer.id, surface]);

  if (!isOfferLive(offer)) return null;

  const openSheet = () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    track('offer_opened', { offerId: offer.id, venueId: offer.venue_id, surface });
    setOpen(true);
  };

  const handleActivate = () => {
    if (isActivated || activate.isPending) return;
    activate.mutate(offer.id, {
      onSuccess: () =>
        track('offer_activated', { offerId: offer.id, venueId: offer.venue_id, eventId: offer.event_id ?? undefined, surface }),
    });
  };

  return (
    <>
      <div
        className={`rounded-2xl border border-primary/40 bg-primary/10 ${compact ? 'p-3' : 'p-4'}`}
        data-testid="live-offer-card"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            <Tag weight="fill" className="h-3 w-3" /> Live Deal
          </span>
          <span className="truncate text-[11px] font-medium text-primary">{offerBadgeText(offer)}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">{offer.title}</p>
        {offer.description && !compact && (
          <p className="mt-1 text-xs text-muted-foreground">{offer.description}</p>
        )}
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock weight="regular" className="h-3 w-3" /> {formatValidity(offer)}
        </p>
        <Button
          size="sm"
          variant={isActivated ? 'outline' : 'default'}
          className="mt-3 min-h-[40px] w-full"
          onClick={openSheet}
        >
          {isActivated ? (
            <>
              <CheckCircle weight="fill" className="mr-1 h-4 w-4" /> Aktiviert
            </>
          ) : (
            'Angebot aktivieren'
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{offer.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-3 pb-6">
            <p className="text-xs text-muted-foreground">{formatValidity(offer)}</p>
            {offer.description && <p className="text-sm text-foreground">{offer.description}</p>}
            {offer.redemption_instruction && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="mb-1 text-[11px] font-semibold text-foreground">Einlösehinweis</p>
                <p className="text-xs text-muted-foreground">{offer.redemption_instruction}</p>
              </div>
            )}
            {isActivated ? (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                <p className="font-semibold">Aktiviert · beim Venue zeigen</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gespeichert in deiner App. Die Einlösung erfolgt direkt vor Ort beim Venue.
                </p>
              </div>
            ) : (
              <Button className="min-h-[44px] w-full" disabled={activate.isPending} onClick={handleActivate}>
                {activate.isPending ? 'Wird aktiviert…' : 'Angebot aktivieren'}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

interface LiveOfferListProps {
  offers: VenueOffer[] | undefined;
  surface: RsvpSurface;
  compact?: boolean;
}

/** Renders nothing when there is no live offer — never an empty section. */
export const LiveOfferList = ({ offers, surface, compact }: LiveOfferListProps) => {
  const live = (offers ?? []).filter((o) => isOfferLive(o));
  if (live.length === 0) return null;
  return (
    <div className="space-y-2">
      {live.map((o) => (
        <LiveOfferCard key={o.id} offer={o} surface={surface} compact={compact} />
      ))}
    </div>
  );
};
