import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMyEvents } from '@/hooks/useEvents';
import { useCreateOffer, useUpdateOffer } from '@/hooks/useVenueOffers';
import {
  OFFER_TYPE_OPTIONS,
  formatValidity,
  validateOfferDraft,
  type OfferDraft,
  type OfferType,
  type VenueOffer,
} from '@/lib/offers';

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyDraft = (): OfferDraft => {
  const now = new Date();
  const end = new Date(now.getTime() + 6 * 3600_000);
  return {
    title: '',
    description: '',
    offer_type: 'discount_percent',
    display_text: '',
    starts_at: toLocalInput(now.toISOString()),
    ends_at: toLocalInput(end.toISOString()),
    redemption_instruction: '',
    max_activations: '',
    event_id: null,
  };
};

interface OfferFormDialogProps {
  venueId: string;
  offer?: VenueOffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfferFormDialog = ({ venueId, offer, open, onOpenChange }: OfferFormDialogProps) => {
  const { toast } = useToast();
  const { data: myEvents = [] } = useMyEvents();
  const create = useCreateOffer();
  const update = useUpdateOffer();
  const [draft, setDraft] = useState<OfferDraft>(() =>
    offer
      ? {
          title: offer.title,
          description: offer.description ?? '',
          offer_type: offer.offer_type,
          display_text: offer.display_text ?? '',
          starts_at: toLocalInput(offer.starts_at),
          ends_at: toLocalInput(offer.ends_at),
          redemption_instruction: offer.redemption_instruction ?? '',
          max_activations: offer.max_activations ? String(offer.max_activations) : '',
          event_id: offer.event_id,
        }
      : emptyDraft(),
  );
  const [showPreview, setShowPreview] = useState(false);

  const set = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors = validateOfferDraft(draft);

  const submit = async (status: 'draft' | 'active') => {
    if (status === 'active' && errors.length > 0) {
      toast({ title: 'Bitte prüfen', description: errors[0], variant: 'destructive' });
      return;
    }
    if (!draft.title.trim()) {
      toast({ title: 'Bitte prüfen', description: 'Titel ist erforderlich.', variant: 'destructive' });
      return;
    }
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
    };
    try {
      if (offer) await update.mutateAsync({ id: offer.id, patch: payload });
      else await create.mutateAsync(payload);
      toast({ title: status === 'active' ? 'Angebot veröffentlicht' : 'Als Entwurf gespeichert' });
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      toast({
        title: 'Konnte nicht gespeichert werden',
        description: message.includes('Event does not belong')
          ? 'Das gewählte Event gehört nicht zu deinem Venue.'
          : message,
        variant: 'destructive',
      });
    }
  };

  const previewOffer: VenueOffer = {
    id: offer?.id ?? 'preview',
    venue_id: venueId,
    event_id: draft.event_id,
    title: draft.title || 'Angebotstitel',
    description: draft.description || null,
    offer_type: draft.offer_type,
    display_text: draft.display_text || null,
    starts_at: new Date(draft.starts_at).toISOString(),
    ends_at: new Date(draft.ends_at).toISOString(),
    status: 'active',
    redemption_instruction: draft.redemption_instruction || null,
    max_activations: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? 'Angebot bearbeiten' : 'Angebot erstellen'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="offer-title">Angebotstitel</Label>
            <Input id="offer-title" value={draft.title} maxLength={80} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div>
            <Label>Angebotstyp</Label>
            <Select value={draft.offer_type} onValueChange={(v) => set('offer_type', v as OfferType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OFFER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="offer-value">Anzeigewert (z. B. „-20 %“)</Label>
            <Input id="offer-value" value={draft.display_text} maxLength={40} onChange={(e) => set('display_text', e.target.value)} />
          </div>

          <div>
            <Label htmlFor="offer-desc">Kurzbeschreibung</Label>
            <Textarea id="offer-desc" rows={2} maxLength={280} value={draft.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div>
            <Label>Mit Event verknüpfen</Label>
            <Select
              value={draft.event_id ?? 'none'}
              onValueChange={(v) => set('event_id', v === 'none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Kein Event" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Event (Venue-Angebot)</SelectItem>
                {myEvents.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="offer-start">Gültig von</Label>
              <Input id="offer-start" type="datetime-local" value={draft.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="offer-end">Gültig bis</Label>
              <Input id="offer-end" type="datetime-local" value={draft.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="offer-redeem">Einlösehinweis</Label>
            <Textarea
              id="offer-redeem"
              rows={2}
              maxLength={280}
              placeholder="z. B. An der Bar zeigen"
              value={draft.redemption_instruction}
              onChange={(e) => set('redemption_instruction', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="offer-limit">Aktivierungslimit (optional)</Label>
            <Input id="offer-limit" type="number" min={1} value={draft.max_activations} onChange={(e) => set('max_activations', e.target.value)} />
          </div>

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <button type="button" className="text-xs text-primary underline" onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
          </button>

          {showPreview && (
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Live Deal</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{previewOffer.title}</p>
              {previewOffer.description && <p className="mt-1 text-xs text-muted-foreground">{previewOffer.description}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">{formatValidity(previewOffer)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => submit('draft')} disabled={create.isPending || update.isPending}>
              Entwurf speichern
            </Button>
            <Button className="flex-1" onClick={() => submit('active')} disabled={errors.length > 0 || create.isPending || update.isPending}>
              Angebot veröffentlichen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
