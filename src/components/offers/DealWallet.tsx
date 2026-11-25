import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, MapPin, Ticket, X } from '@phosphor-icons/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDealWallet, type WalletItem } from '@/hooks/useDealWallet';
import {
  OFFER_CATEGORY_COLORS, OFFER_CATEGORY_EMOJI, asCategory, formatShortCode, walletCardState, type WalletCardState,
} from '@/lib/offers';
import { cn } from '@/lib/utils';

const time = (iso: string) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

const STATE_LABEL: Record<WalletCardState, string> = {
  ready: 'Bereit zum Einlösen',
  upcoming: 'Noch nicht gestartet',
  redeemed: 'Eingelöst',
  expired: 'Abgelaufen',
};

/** Card face: the top strip is what shows while stacked; the body only when opened. */
const WalletCardFace = ({ item, open, state }: { item: WalletItem; open: boolean; state: WalletCardState }) => {
  const [from, to] = OFFER_CATEGORY_COLORS[asCategory(item.category)];
  const dimmed = state === 'redeemed' || state === 'expired';
  return (
    <div
      className={cn('overflow-hidden rounded-3xl text-white shadow-xl ring-1 ring-white/10', dimmed && 'grayscale-[60%] opacity-80')}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="flex h-[76px] items-center gap-3 px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-xl">
          {item.venue_image_url ? <img src={item.venue_image_url} alt="" className="h-full w-full object-cover" /> : OFFER_CATEGORY_EMOJI[asCategory(item.category)]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/80">{item.venue_name}</p>
          <p className="truncate font-bold">{item.title}</p>
        </div>
        <span className="shrink-0 text-lg font-black uppercase">{item.display_text}</span>
      </div>

      {open && (
        <div className="px-5 pb-6">
          <div className="rounded-2xl bg-white p-4 text-center text-gray-900">
            {state === 'redeemed' ? (
              <div className="flex flex-col items-center py-8">
                <CheckCircle weight="fill" className="h-16 w-16 text-green-500" />
                <p className="mt-2 font-bold">Eingelöst</p>
                {item.redeemed_at && <p className="text-xs text-gray-500">{time(item.redeemed_at)}</p>}
              </div>
            ) : state === 'expired' ? (
              <div className="py-10 text-sm font-semibold text-gray-500">Dieser Deal ist abgelaufen.</div>
            ) : (
              <>
                <QRCodeSVG
                  value={item.claim_token}
                  size={208}
                  level="M"
                  marginSize={2}
                  className="mx-auto h-auto w-full max-w-[208px]"
                  data-testid="wallet-qr"
                />
                <p className="mt-3 text-[11px] uppercase tracking-wider text-gray-500">oder Code nennen</p>
                <p className="font-mono text-2xl font-black tracking-[0.2em]" data-testid="wallet-short-code">{formatShortCode(item.short_code)}</p>
              </>
            )}
          </div>
          <div className="mt-4 space-y-1.5 text-sm text-white/90">
            <p className="flex items-center gap-2"><Ticket weight="fill" className="h-4 w-4" />{STATE_LABEL[state]}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{time(item.starts_at)} – {time(item.ends_at)}</p>
            {item.conditions && <p className="text-xs text-white/80">{item.conditions}</p>}
            <p className="text-xs text-white/80">{item.redemption_instruction || 'Zeig den QR-Code an der Bar – das Team scannt ihn.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface DealWalletProps {
  /** Activation to open right away (e.g. just activated). */
  focusId?: string | null;
  /** Show the "Verlauf" (used/expired) section. */
  showHistory?: boolean;
}

/** The user's private deal wallet: tickets stacked like Apple Wallet; tap one to show its QR code. */
export const DealWallet = ({ focusId, showHistory = true }: DealWalletProps) => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(focusId ?? null);
  const { data, isLoading } = useDealWallet({ live: !!openId });
  const [, setTick] = useState(0);

  // Re-evaluate states (upcoming → ready → expired) every 30 s.
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 30_000); return () => clearInterval(t); }, []);
  useEffect(() => { if (focusId) setOpenId(focusId); }, [focusId]);

  const { active, history } = useMemo(() => {
    const items = (data ?? []).map((item) => ({ item, state: walletCardState(item) }));
    return {
      active: items.filter((x) => x.state === 'ready' || x.state === 'upcoming'),
      history: items.filter((x) => x.state === 'redeemed' || x.state === 'expired'),
    };
  }, [data]);

  if (isLoading && !data) return <Skeleton className="h-40 w-full rounded-3xl" />;

  if (active.length === 0 && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 py-12 text-center">
        <Ticket weight="thin" className="mb-2 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Noch keine Deals</p>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">Aktiviere einen Live-Deal auf dem Profil eines Spots – er landet dann hier.</p>
        <button type="button" onClick={() => navigate('/discover')} className="mt-4 text-xs font-semibold text-primary">Spots entdecken</button>
      </div>
    );
  }

  const opened = [...active, ...history].find((x) => x.item.activation_id === openId);

  return (
    <div data-testid="deal-wallet">
      {/* Stack: each card peeks out 64 px below the previous one */}
      <div className="relative" style={{ height: active.length ? 76 + (active.length - 1) * 64 + 16 : 0 }}>
        {active.map(({ item, state }, i) => (
          <motion.button
            key={item.activation_id}
            type="button"
            layoutId={`wallet-${item.activation_id}`}
            onClick={() => setOpenId(item.activation_id)}
            className="absolute inset-x-0 text-left"
            style={{ top: i * 64, zIndex: i }}
            whileTap={{ scale: 0.98 }}
            data-testid="wallet-card"
          >
            <WalletCardFace item={item} open={false} state={state} />
          </motion.button>
        ))}
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verlauf</p>
          <div className="space-y-2">
            {history.map(({ item, state }) => (
              <button key={item.activation_id} type="button" onClick={() => setOpenId(item.activation_id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 text-left">
                <span className="text-lg">{OFFER_CATEGORY_EMOJI[asCategory(item.category)]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{item.venue_name}</p>
                </div>
                <span className={cn('text-xs font-semibold', state === 'redeemed' ? 'text-green-500' : 'text-muted-foreground')}>{STATE_LABEL[state]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opened card, full screen with a bright background for scanning in the dark */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col bg-background/95 px-4 backdrop-blur-xl"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label={opened.item.title}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setOpenId(null)} aria-label="Schließen" className="rounded-full glass-pill p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <motion.div layoutId={`wallet-${opened.item.activation_id}`} className="mx-auto w-full max-w-md">
              <WalletCardFace item={opened.item} open state={opened.state} />
            </motion.div>
            <button type="button" onClick={() => navigate(`/venues/${opened.item.venue_id}`)}
              className="mx-auto mt-4 text-xs font-semibold text-muted-foreground">Zum Spot</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
