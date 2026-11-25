import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Confetti, Fire } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OfferFormDialog } from '@/components/offers/OfferFormDialog';
import { useMyVenue } from '@/hooks/useVenueOffers';

interface VenueCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "+" for venue accounts: Beitrag, Live-Deal or Event. */
export const VenueCreateSheet = ({ open, onOpenChange }: VenueCreateSheetProps) => {
  const navigate = useNavigate();
  const { data: venue } = useMyVenue();
  const [dealOpen, setDealOpen] = useState(false);
  const verified = venue?.verification_status === 'approved';

  const go = (path: string) => { onOpenChange(false); navigate(path); };
  const openDeal = () => {
    if (!venue) { toast.error('Lege zuerst deinen Spot an, dann kannst du Deals posten.'); return; }
    onOpenChange(false);
    setDealOpen(true);
  };

  const options = [
    { id: 'post', icon: Camera, title: 'Beitrag', description: 'Foto, Video oder Story aus deinem Spot', onClick: () => go('/create') },
    {
      id: 'deal', icon: Fire, title: 'Live-Deal 🔥', highlighted: true, onClick: openDeal,
      description: verified
        ? 'Angebot für heute – alle mit Glocke bekommen sofort eine Mitteilung'
        : 'Angebot für heute – Mitteilungen an deine Follower starten, sobald dein Spot verifiziert ist',
    },
    { id: 'event', icon: Confetti, title: 'Event', description: 'Erstelle ein Event mit allen Details', onClick: () => go('/events/create') },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <SheetHeader><SheetTitle>Was möchtest du posten?</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2">
            {options.map(({ id, icon: Icon, title, description, highlighted, onClick }) => (
              <button
                key={id}
                type="button"
                data-testid={`venue-create-${id}`}
                onClick={onClick}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-primary/60 ${highlighted ? 'border-primary/50 bg-primary/10' : 'border-border/60 bg-card'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-pill">
                  <Icon weight="fill" className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {venue && <OfferFormDialog venueId={venue.id} open={dealOpen} onOpenChange={setDealOpen} />}
    </>
  );
};
