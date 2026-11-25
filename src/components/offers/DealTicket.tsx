import { Check, Clock, Ticket } from '@phosphor-icons/react';
import {
  OFFER_CATEGORY_COLORS, OFFER_CATEGORY_EMOJI, asCategory, formatValidity, offerBadgeText, resolveOfferState,
  type VenueOffer,
} from '@/lib/offers';
import { cn } from '@/lib/utils';

export type DealTicketState = 'open' | 'activated' | 'redeemed';

interface DealTicketProps {
  offer: VenueOffer;
  venueName?: string | null;
  /** Remaining contingent; null/undefined = unlimited. */
  remaining?: number | null;
  state?: DealTicketState;
  busy?: boolean;
  onActivate?: () => void;
  onOpenWallet?: () => void;
  /** Preview inside the creation form: no buttons, never hidden. */
  preview?: boolean;
  compact?: boolean;
  className?: string;
}

/** A deal drawn as a tear-off ticket: value stub on the left, details + action on the right. */
export const DealTicket = ({
  offer, venueName, remaining, state = 'open', busy, onActivate, onOpenWallet, preview, compact, className,
}: DealTicketProps) => {
  const category = asCategory(offer.category);
  const [from, to] = OFFER_CATEGORY_COLORS[category];
  const phase = resolveOfferState(offer);
  const soldOut = remaining === 0 && state === 'open';
  const upcoming = phase === 'scheduled';

  return (
    <div
      data-testid="deal-ticket"
      className={cn('relative flex overflow-hidden rounded-2xl text-white shadow-lg', compact ? 'min-h-[104px]' : 'min-h-[128px]', className)}
      style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}
    >
      {offer.image_url && (
        <img src={offer.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
      )}

      {/* Stub */}
      <div className={cn('relative flex shrink-0 flex-col items-center justify-center px-3 text-center', compact ? 'w-24' : 'w-28')}>
        <span className="text-2xl leading-none" aria-hidden>{OFFER_CATEGORY_EMOJI[category]}</span>
        <span className={cn('mt-1 font-black uppercase leading-tight tracking-tight', compact ? 'text-base' : 'text-lg')}>
          {offerBadgeText(offer)}
        </span>
        {offer.min_age ? <span className="mt-1 rounded-full bg-black/25 px-1.5 text-[10px] font-bold">{offer.min_age}+</span> : null}
      </div>

      {/* Perforation with notches */}
      <div className="relative w-0 border-l-2 border-dashed border-white/50">
        <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-background" />
        <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-background" />
      </div>

      {/* Details */}
      <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
            <Ticket weight="fill" className="h-3 w-3" />
            {upcoming ? 'Deal heute' : 'Live-Deal'}
            {venueName ? <span className="truncate font-semibold normal-case tracking-normal"> · {venueName}</span> : null}
          </p>
          <p className={cn('mt-0.5 font-bold leading-snug', compact ? 'text-sm' : 'text-base')}>{offer.title}</p>
          {offer.conditions && !compact && <p className="mt-0.5 text-[11px] text-white/80">{offer.conditions}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-white/85">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatValidity(offer)}</span>
            {remaining != null && remaining > 0 && remaining <= 20 && <span className="font-semibold">· nur noch {remaining}</span>}
          </p>
        </div>

        {!preview && (
          state === 'redeemed' ? (
            <span className="flex items-center gap-1 self-start rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold">
              <Check weight="bold" className="h-3.5 w-3.5" /> Eingelöst
            </span>
          ) : state === 'activated' ? (
            <button
              type="button"
              onClick={onOpenWallet}
              data-testid="deal-ticket-open-wallet"
              className="flex items-center gap-1 self-start rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-900"
            >
              <Check weight="bold" className="h-3.5 w-3.5" /> Aktiviert · QR zeigen
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              disabled={busy || soldOut}
              data-testid="deal-ticket-activate"
              className="self-start rounded-full bg-white px-4 py-1.5 text-xs font-bold text-gray-900 shadow transition active:scale-95 disabled:opacity-60"
            >
              {soldOut ? 'Vergriffen' : busy ? 'Wird aktiviert…' : 'Aktivieren'}
            </button>
          )
        )}
      </div>
    </div>
  );
};
