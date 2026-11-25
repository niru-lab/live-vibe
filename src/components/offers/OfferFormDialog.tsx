import { useRef, useState } from 'react';
import { ImageSquare, Trash } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMyEvents } from '@/hooks/useEvents';
import { useCreateOffer, useUpdateOffer } from '@/hooks/useVenueOffers';
import { supabase } from '@/integrations/supabase/client';
import { DealTicket } from './DealTicket';
import {
  DEFAULT_DISPLAY_TEXT,
  OFFER_CATEGORY_OPTIONS,
  OFFER_TYPE_OPTIONS,
  tonightWindow,
  validateOfferDraft,
  type OfferCategory,
  type OfferDraft,
  type OfferType,
  type VenueOffer,
} from '@/lib/offers';
import { cn } from '@/lib/utils';

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyDraft = (): OfferDraft => {
  const { start, end } = tonightWindow();
  return {
    title: '',
    description: '',
    offer_type: 'two_for_one',
    display_text: DEFAULT_DISPLAY_TEXT.two_for_one,
    starts_at: toLocalInput(start),
    ends_at: toLocalInput(end),
    redemption_instruction: '',
    max_activations: '',
    event_id: null,
    category: 'alcohol',
    image_url: null,
    conditions: '',
  };
};

const fromOffer = (offer: VenueOffer): OfferDraft => ({
  title: offer.title,
  description: offer.description ?? '',
  offer_type: offer.offer_type,
  display_text: offer.display_text ?? '',
  starts_at: toLocalInput(new Date(offer.starts_at)),
  ends_at: toLocalInput(new Date(offer.ends_at)),
  redemption_instruction: offer.redemption_instruction ?? '',
  max_activations: offer.max_activations ? String(offer.max_activations) : '',
  event_id: offer.event_id,
  category: offer.category ?? 'other',
  image_url: offer.image_url ?? null,
  conditions: offer.conditions ?? '',
});

const STEPS = ['Was gibt’s?', 'Wann?', 'Extras', 'Vorschau'] as const;
const LIMIT_PRESETS = ['', '20', '50', '100'];
type TimePreset = 'tonight' | 'now3h' | 'custom';

const Chip = ({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className={cn(
      'rounded-full border px-3 py-1.5 text-sm transition',
      active ? 'border-primary bg-primary/15 font-semibold text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/50',
    )}
  >
    {children}
  </button>
);

interface OfferFormDialogProps {
  venueId: string;
  offer?: VenueOffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Deal creation in 4 short steps: what → when → extras → preview & publish. */
export const OfferFormDialog = ({ venueId, offer, open, onOpenChange }: OfferFormDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myEvents = [] } = useMyEvents();
  const create = useCreateOffer();
  const update = useUpdateOffer();
  const [draft, setDraft] = useState<OfferDraft>(() => (offer ? fromOffer(offer) : emptyDraft()));
  const [step, setStep] = useState(0);
  const [timePreset, setTimePreset] = useState<TimePreset>(offer ? 'custom' : 'tonight');
  const [customLimit, setCustomLimit] = useState(!!offer?.max_activations && !LIMIT_PRESETS.includes(String(offer.max_activations)));
  const [uploading, setUploading] = useState(false);
  const displayTouched = useRef(!!offer);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const errors = validateOfferDraft(draft);
  const saving = create.isPending || update.isPending;

  const setType = (t: OfferType) => {
    setDraft((d) => ({ ...d, offer_type: t, display_text: displayTouched.current ? d.display_text : DEFAULT_DISPLAY_TEXT[t] }));
  };

  const applyPreset = (p: TimePreset) => {
    setTimePreset(p);
    if (p === 'tonight') {
      const { start, end } = tonightWindow();
      setDraft((d) => ({ ...d, starts_at: toLocalInput(start), ends_at: toLocalInput(end) }));
    } else if (p === 'now3h') {
      const now = new Date();
      setDraft((d) => ({ ...d, starts_at: toLocalInput(now), ends_at: toLocalInput(new Date(now.getTime() + 3 * 3_600_000)) }));
    }
  };

  const uploadImage = async (file: File) => {
    if (!user) return;
    if (file.size > 8 * 1024 * 1024) { toast({ title: 'Bild ist zu groß', description: 'Maximal 8 MB.', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/deal-images/${venueId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('post-media').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('post-media').getPublicUrl(path);
      set('image_url', data.publicUrl);
    } catch {
      toast({ title: 'Upload fehlgeschlagen', description: 'Bitte versuch es nochmal.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const stepError = (s: number): string | null => {
    if (s === 0 && !draft.title.trim()) return 'Beschreib kurz, was es gibt.';
    if (s === 1) return errors.find((e) => e.includes('Gültig') || e.includes('abgelaufen') || e.includes('Zeitraum')) ?? null;
    if (s === 2) return errors.find((e) => e.includes('Bedingungen') || e.includes('limit')) ?? null;
    return null;
  };

  const next = () => {
    const err = stepError(step);
    if (err) { toast({ title: 'Bitte prüfen', description: err, variant: 'destructive' }); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async (status: 'draft' | 'active') => {
    if (status === 'active' && errors.length > 0) {
      toast({ title: 'Bitte prüfen', description: errors[0], variant: 'destructive' });
      return;
    }
    if (!draft.title.trim()) { setStep(0); return; }
    const payload = {
      venue_id: venueId,
      event_id: draft.event_id,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      offer_type: draft.offer_type,
      display_text: draft.display_text.trim() || null,
      starts_at: new Date(draft.starts_at).toISOString(),
      ends_at: new Date(draft.ends_at).toISOString(),
      status,
      redemption_instruction: draft.redemption_instruction.trim() || null,
      max_activations: draft.max_activations ? Number(draft.max_activations) : null,
      category: draft.category,
      image_url: draft.image_url,
      conditions: draft.conditions.trim() || null,
    };
    try {
      if (offer) await update.mutateAsync({ id: offer.id, patch: payload });
      else await create.mutateAsync(payload);
      toast({ title: status === 'active' ? 'Deal ist live 🔥' : 'Als Entwurf gespeichert' });
      onOpenChange(false);
      setStep(0);
      if (!offer) setDraft(emptyDraft());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      toast({
        title: 'Konnte nicht gespeichert werden',
        description: message.includes('Event does not belong') ? 'Das gewählte Event gehört nicht zu deinem Venue.' : message,
        variant: 'destructive',
      });
    }
  };

  const previewOffer: VenueOffer = {
    id: offer?.id ?? 'preview',
    venue_id: venueId,
    event_id: draft.event_id,
    title: draft.title || 'Was gibt es?',
    description: draft.description || null,
    offer_type: draft.offer_type,
    display_text: draft.display_text || null,
    starts_at: new Date(draft.starts_at).toISOString(),
    ends_at: new Date(draft.ends_at).toISOString(),
    status: 'active',
    redemption_instruction: draft.redemption_instruction || null,
    max_activations: draft.max_activations ? Number(draft.max_activations) : null,
    category: draft.category,
    image_url: draft.image_url,
    conditions: draft.conditions || null,
    min_age: draft.category === 'alcohol' ? 18 : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? 'Deal bearbeiten' : 'Live-Deal erstellen 🔥'}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1.5" aria-label={`Schritt ${step + 1} von ${STEPS.length}`}>
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={cn('h-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
              <p className={cn('mt-1 text-[10px]', i === step ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-1">
          {step === 0 && (
            <>
              <div>
                <Label>Kategorie</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {OFFER_CATEGORY_OPTIONS.map((c) => (
                    <Chip key={c.value} active={draft.category === c.value} onClick={() => set('category', c.value as OfferCategory)} testId={`deal-cat-${c.value}`}>
                      {c.emoji} {c.label}
                    </Chip>
                  ))}
                </div>
                {draft.category === 'alcohol' && (
                  <p className="mt-2 text-[11px] text-muted-foreground">Alkohol-Deals sehen nur Gäste ab 18 – das ist gesetzlich vorgeschrieben.</p>
                )}
              </div>
              <div>
                <Label>Art</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {OFFER_TYPE_OPTIONS.map((o) => (
                    <Chip key={o.value} active={draft.offer_type === o.value} onClick={() => setType(o.value)}>{o.label}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="deal-value">Großer Wert auf dem Ticket</Label>
                <Input id="deal-value" value={draft.display_text} maxLength={14} placeholder="z. B. 2 FÜR 1"
                  onChange={(e) => { displayTouched.current = true; set('display_text', e.target.value); }} />
              </div>
              <div>
                <Label htmlFor="deal-title">Was genau?</Label>
                <Input id="deal-title" data-testid="deal-title" value={draft.title} maxLength={60}
                  placeholder="z. B. auf alle Longdrinks" onChange={(e) => set('title', e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Chip active={timePreset === 'tonight'} onClick={() => applyPreset('tonight')}>🌙 Heute Abend (20–02 Uhr)</Chip>
                <Chip active={timePreset === 'now3h'} onClick={() => applyPreset('now3h')}>⚡ Ab jetzt, 3 Std.</Chip>
                <Chip active={timePreset === 'custom'} onClick={() => setTimePreset('custom')}>📅 Eigener Zeitraum</Chip>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deal-start">Von</Label>
                  <Input id="deal-start" type="datetime-local" value={draft.starts_at} disabled={timePreset !== 'custom'}
                    onChange={(e) => set('starts_at', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="deal-end">Bis</Label>
                  <Input id="deal-end" type="datetime-local" value={draft.ends_at} disabled={timePreset !== 'custom'}
                    onChange={(e) => set('ends_at', e.target.value)} />
                </div>
              </div>
              {myEvents.length > 0 && (
                <div>
                  <Label>Zu einem Event? (optional)</Label>
                  <Select value={draft.event_id ?? 'none'} onValueChange={(v) => set('event_id', v === 'none' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Kein Event" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Event</SelectItem>
                      {myEvents.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Bild (empfohlen)</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }} />
                {draft.image_url ? (
                  <div className="relative mt-2 overflow-hidden rounded-xl">
                    <img src={draft.image_url} alt="" className="h-32 w-full object-cover" />
                    <button type="button" onClick={() => set('image_url', null)} aria-label="Bild entfernen"
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><Trash className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="mt-2 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    <ImageSquare className="h-6 w-6" />
                    {uploading ? 'Lädt hoch…' : 'Foto hinzufügen'}
                  </button>
                )}
              </div>
              <div>
                <Label>Wie viele insgesamt?</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LIMIT_PRESETS.map((v) => (
                    <Chip key={v || 'none'} active={!customLimit && draft.max_activations === v}
                      onClick={() => { setCustomLimit(false); set('max_activations', v); }}>
                      {v ? `Die ersten ${v}` : 'Unbegrenzt'}
                    </Chip>
                  ))}
                  <Chip active={customLimit} onClick={() => setCustomLimit(true)}>Eigene Zahl</Chip>
                </div>
                {customLimit && (
                  <Input className="mt-2" type="number" min={1} inputMode="numeric" value={draft.max_activations}
                    onChange={(e) => set('max_activations', e.target.value)} placeholder="z. B. 30" />
                )}
              </div>
              <div>
                <Label htmlFor="deal-conditions">Bedingungen (optional)</Label>
                <Input id="deal-conditions" value={draft.conditions} maxLength={200}
                  placeholder="z. B. nur an der Bar, ab 2 Personen" onChange={(e) => set('conditions', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="deal-redeem">Hinweis zum Einlösen (optional)</Label>
                <Input id="deal-redeem" value={draft.redemption_instruction} maxLength={120}
                  placeholder="z. B. QR-Code an der Bar zeigen" onChange={(e) => set('redemption_instruction', e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <DealTicket offer={previewOffer} preview />
              <ul className="space-y-1 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
                <li>• Sichtbar auf deinem Profil unter „Deals“, solange er läuft.</li>
                <li>• Alle mit Glocke 🔔 bekommen sofort eine Mitteilung (nur verifizierte Spots).</li>
                <li>• Jeder Gast kann ihn 1× aktivieren und bekommt einen QR-Code – den scannst du vor Ort.</li>
              </ul>
              {errors.length > 0 && (
                <ul className="space-y-1 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {errors.map((e) => <li key={e}>{e}</li>)}
                </ul>
              )}
            </>
          )}

          <div className="flex gap-2 pt-1">
            {step > 0 ? (
              <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)} disabled={saving}>Zurück</Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={() => submit('draft')} disabled={saving || !draft.title.trim()}>Entwurf</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button className="flex-1" onClick={next} data-testid="deal-next">Weiter</Button>
            ) : (
              <Button className="flex-1" onClick={() => submit('active')} disabled={errors.length > 0 || saving} data-testid="deal-publish">
                {offer ? 'Speichern & live' : 'Live schalten 🔥'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
