import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Copy, ShareNetwork, Trash, UserPlus, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QrScanner } from '@/components/offers/QrScanner';
import {
  useAcceptStaffInvite, useCreateStaffInvite, useRedeemDeal, useRemoveStaff, useScanVenues, useVenueStaff,
  type RedeemResult,
} from '@/hooks/useDealWallet';
import { normalizeScanInput, scanMessage, shouldProcessScan, staffInviteLink } from '@/lib/dealScan';
import { cn } from '@/lib/utils';

/** Owner: invite and remove bar staff (scan-only access). */
const StaffManager = ({ venueId, venueName }: { venueId: string; venueName: string }) => {
  const { data: staff = [], isLoading } = useVenueStaff(venueId);
  const createInvite = useCreateStaffInvite();
  const remove = useRemoveStaff(venueId);
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const link = invite ? staffInviteLink(window.location.origin, invite.code) : '';

  const share = async () => {
    const text = `Du kannst jetzt Deals bei ${venueName} scannen: ${link} (Code: ${invite?.code})`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancelled */ } }
    await navigator.clipboard?.writeText(text);
    toast.success('Einladung kopiert');
  };

  return (
    <section className="mt-8 space-y-3" aria-label="Barkeeper">
      <h2 className="text-sm font-semibold">Barkeeper</h2>
      <p className="text-xs text-muted-foreground">Barkeeper melden sich mit ihrem eigenen Feyrn-Account an und können nur scannen – keine Deals erstellen, nichts bearbeiten.</p>
      {isLoading ? <Skeleton className="h-12 w-full rounded-xl" /> : staff.map((s) => (
        <div key={s.user_id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
          {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-muted" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.display_name || s.username || 'Barkeeper'}</p>
            {s.username && <p className="truncate text-xs text-muted-foreground">@{s.username}</p>}
          </div>
          <Button size="icon" variant="ghost" aria-label="Entfernen" onClick={() => remove.mutate(s.user_id)}><Trash className="h-4 w-4" /></Button>
        </div>
      ))}
      {invite ? (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Einladungscode (48 Std. gültig, einmal nutzbar)</p>
          <p className="my-1 font-mono text-2xl font-black tracking-[0.2em]">{invite.code}</p>
          <div className="mt-2 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(link); toast.success('Link kopiert'); }}><Copy className="mr-1 h-4 w-4" />Link</Button>
            <Button size="sm" onClick={share}><ShareNetwork className="mr-1 h-4 w-4" />Teilen</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" disabled={createInvite.isPending}
          onClick={() => createInvite.mutate(venueId, { onSuccess: setInvite, onError: () => toast.error('Konnte keine Einladung erstellen.') })}>
          <UserPlus className="mr-2 h-4 w-4" />Barkeeper einladen
        </Button>
      )}
    </section>
  );
};

/** Scan deal QR codes (venue owner or invited bar staff). Also accepts staff invites via ?invite=CODE. */
export default function ScanDeals() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: venues, isLoading } = useScanVenues();
  const redeem = useRedeemDeal();
  const accept = useAcceptStaffInvite();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [inviteCode, setInviteCode] = useState(params.get('invite') ?? '');
  const lastScan = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    if (!venueId && venues && venues.length > 0) setVenueId(venues[0].venue_id);
  }, [venues, venueId]);

  const venue = venues?.find((v) => v.venue_id === venueId);

  const submit = useCallback((raw: string) => {
    if (!venueId || redeem.isPending) return;
    const code = normalizeScanInput(raw);
    if (!code) { toast.error('Das ist kein Feyrn-Deal-Code.'); return; }
    const now = Date.now();
    if (!shouldProcessScan(code, lastScan.current, now)) return;
    lastScan.current = { value: code, at: now };
    redeem.mutate({ venueId, code }, {
      onSuccess: (r) => {
        setResult(r);
        setManual('');
        try { navigator.vibrate?.(r.result === 'ok' ? 80 : [60, 60, 60]); } catch { /* not supported */ }
      },
      onError: (e) => toast.error(String(e instanceof Error ? e.message : e).includes('too_many_attempts')
        ? 'Zu viele falsche Codes. Bitte kurz warten.' : 'Scan fehlgeschlagen. Netz prüfen und nochmal versuchen.'),
    });
  }, [venueId, redeem]);

  const acceptInvite = () => {
    accept.mutate(inviteCode, {
      onSuccess: (v) => { toast.success(`Du kannst jetzt für ${v.venue_name} scannen 🎉`); setParams({}); setVenueId(v.venue_id); },
      onError: () => toast.error('Einladung ungültig oder abgelaufen.'),
    });
  };

  const msg = result ? scanMessage(result.result) : null;

  return (
    <AppLayout>
      <div className="mx-auto min-h-screen max-w-md px-4 pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <header className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full glass-pill" onClick={() => navigate(-1)} aria-label="Zurück">
            <ArrowLeft weight="bold" className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold">Deals scannen</h1>
            {venue && <p className="truncate text-xs text-muted-foreground">{venue.venue_name}{venue.is_staff_only ? ' · Barkeeper' : ''}</p>}
          </div>
        </header>

        {(params.get('invite') || (!isLoading && (!venues || venues.length === 0))) && (
          <section className="mb-6 rounded-2xl border border-border/60 bg-card/70 p-4">
            <h2 className="text-sm font-semibold">Als Barkeeper beitreten</h2>
            <p className="mt-1 text-xs text-muted-foreground">Gib den Einladungscode von deinem Spot ein.</p>
            <div className="mt-3 flex gap-2">
              <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="z. B. K7Q4M2XA"
                className="font-mono uppercase" maxLength={12} data-testid="staff-invite-input" />
              <Button onClick={acceptInvite} disabled={inviteCode.trim().length < 8 || accept.isPending}>Beitreten</Button>
            </div>
          </section>
        )}

        {isLoading && <Skeleton className="aspect-square w-full rounded-3xl" />}

        {venues && venues.length > 0 && venueId && (
          <>
            {venues.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {venues.map((v) => (
                  <button key={v.venue_id} type="button" onClick={() => setVenueId(v.venue_id)}
                    className={cn('rounded-full border px-3 py-1 text-xs', v.venue_id === venueId ? 'border-primary bg-primary/15 text-primary' : 'border-border/60 text-muted-foreground')}>
                    {v.venue_name}
                  </button>
                ))}
              </div>
            )}

            <QrScanner onDecode={submit} paused={!!result || redeem.isPending} />

            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(manual); }}>
              <Input value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="Code eingeben, z. B. K7Q-4M2"
                className="font-mono uppercase" maxLength={9} inputMode="text" autoCapitalize="characters" data-testid="scan-manual-input" />
              <Button type="submit" disabled={!manual.trim() || redeem.isPending}>Prüfen</Button>
            </form>

            {!venue?.is_staff_only && <StaffManager venueId={venueId} venueName={venue?.venue_name ?? ''} />}
          </>
        )}
      </div>

      {/* Result: big and readable across the bar */}
      <Sheet open={!!result} onOpenChange={(o) => { if (!o) setResult(null); }}>
        <SheetContent side="bottom" className={cn('rounded-t-3xl border-t-4', msg?.ok ? 'border-green-500' : 'border-destructive')}>
          <SheetHeader className="sr-only"><SheetTitle>Scan-Ergebnis</SheetTitle></SheetHeader>
          {result && msg && (
            <div className="flex flex-col items-center pb-6 pt-2 text-center" data-testid={`scan-result-${result.result}`}>
              {msg.ok ? <CheckCircle weight="fill" className="h-20 w-20 text-green-500" /> : <XCircle weight="fill" className="h-20 w-20 text-destructive" />}
              <p className="mt-2 text-2xl font-black">{msg.title}</p>
              {result.offer_title && (
                <p className="mt-2 text-lg font-bold">{result.display_text ? `${result.display_text} · ` : ''}{result.offer_title}</p>
              )}
              {(result.guest_display_name || result.guest_username) && (
                <div className="mt-3 flex items-center gap-2">
                  {result.guest_avatar_url && <img src={result.guest_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  <span className="text-sm font-medium">{result.guest_display_name || `@${result.guest_username}`}</span>
                </div>
              )}
              {result.result === 'already_redeemed' && result.redeemed_at && (
                <p className="mt-1 text-xs text-muted-foreground">Eingelöst um {new Date(result.redeemed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{msg.hint}</p>
              <Button className="mt-6 w-full" size="lg" onClick={() => setResult(null)} data-testid="scan-next">Nächster Scan</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
