import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode, Tag } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { OfferFormDialog } from '@/components/offers/OfferFormDialog';
import { useManagedOffers, useMyVenue, useUpdateOffer, useVenueOfferStats } from '@/hooks/useVenueOffers';
import { formatValidity, resolveOfferState, type VenueOffer } from '@/lib/offers';

const STATE_LABEL: Record<string, string> = {
  live: 'Live',
  scheduled: 'Geplant',
  expired: 'Abgelaufen',
  inactive: 'Nicht aktiv',
};

/** Venue-owner management area for Live Offers, incl. aggregate activations. */
export const VenueOffersSection = () => {
  const { data: venue } = useMyVenue();
  const venueId = venue?.id as string | undefined;
  const { data: offers = [], isLoading } = useManagedOffers(venueId);
  const { data: stats = [] } = useVenueOfferStats(venueId);
  const update = useUpdateOffer();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueOffer | null>(null);
  const navigate = useNavigate();

  if (!venueId) return null;

  const statFor = (id: string) => stats.find((s) => s.offer_id === id);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tag weight="fill" className="h-4 w-4 text-primary" /> Live-Deals
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/scan')} data-testid="dashboard-scan">
            <QrCode weight="bold" className="mr-1 h-3 w-3" /> Scannen
          </Button>
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus weight="bold" className="mr-1 h-3 w-3" /> Deal
          </Button>
        </div>
      </div>

      {!isLoading && offers.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
          <p className="text-sm text-foreground">Noch kein Angebot veröffentlicht.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Zeitlich begrenzte Deals erscheinen bei deinem Event, auf der Karte und in deinem Venue-Profil.
          </p>
        </div>
      )}

      {offers.map((o) => {
        const state = resolveOfferState(o);
        return (
          <div key={o.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                <p className="text-[11px] text-muted-foreground">{formatValidity(o)}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${
                  state === 'live' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {STATE_LABEL[state]}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground" data-testid="deal-funnel">
                {(() => {
                  const st = statFor(o.id);
                  const act = st?.activations ?? 0;
                  const red = st?.redemptions ?? 0;
                  const failed = st?.failed_scans ?? 0;
                  return (
                    <>
                      <b className="text-foreground">{act}</b>{o.max_activations ? `/${o.max_activations}` : ''} aktiviert · <b className="text-foreground">{red}</b> eingelöst
                      {failed > 0 && <> · <span className="text-destructive">{failed} abgelehnt</span></>}
                      {o.event_id ? ' · mit Event' : ''}
                    </>
                  );
                })()}
              </span>
              <div className="flex gap-2">
                {state === 'live' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update.mutate({ id: o.id, patch: { status: 'paused' } })}
                  >
                    Pausieren
                  </Button>
                )}
                {o.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update.mutate({ id: o.id, patch: { status: 'active' } })}
                  >
                    Fortsetzen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(o);
                    setFormOpen(true);
                  }}
                >
                  Bearbeiten
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {formOpen && (
        <OfferFormDialog
          key={editing?.id ?? 'new'}
          venueId={venueId}
          offer={editing}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}
    </section>
  );
};
