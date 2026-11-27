import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// 'review', 'fake' and 'personal_data' come from drizzle/migrations/0009 (not in generated types yet).
export type ReportTarget = 'post' | 'profile' | 'room' | 'event' | 'message' | 'comment' | 'review';
type Reason = 'spam' | 'harassment' | 'nudity' | 'violence' | 'illegal' | 'other' | 'fake' | 'personal_data';

const REASONS: { value: Reason; label: string }[] = [
  { value: 'spam', label: 'Spam oder Werbung' },
  { value: 'harassment', label: 'Belästigung oder Hass' },
  { value: 'nudity', label: 'Nacktheit / sexuelle Inhalte' },
  { value: 'violence', label: 'Gewalt oder Bedrohung' },
  { value: 'illegal', label: 'Illegale Aktivität' },
  { value: 'other', label: 'Sonstiges' },
];

// Reviews: only reasons that justify moderation. "Bad rating" is deliberately not a reason.
const REVIEW_REASONS: { value: Reason; label: string }[] = [
  { value: 'harassment', label: 'Beleidigung oder Hass' },
  { value: 'personal_data', label: 'Nennt private Daten / Namen von Mitarbeitern' },
  { value: 'fake', label: 'Fake – war nicht wirklich hier' },
  { value: 'spam', label: 'Spam oder Werbung' },
  { value: 'other', label: 'Sonstiges' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
}

export const ReportDialog = ({ open, onOpenChange, targetType, targetId }: Props) => {
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const isReview = targetType === 'review';
  const reasons = isReview ? REVIEW_REASONS : REASONS;
  const [reason, setReason] = useState<Reason>(reasons[0].value);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!profile) return;
    setLoading(true);
    const row = {
      reporter_id: profile.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      note: note.trim() || null,
    } as unknown as TablesInsert<'reports'>;
    const { error } = await supabase.from('reports').insert(row);
    setLoading(false);
    if (error && !error.message.includes('duplicate')) {
      toast({ variant: 'destructive', title: 'Fehler', description: error.message });
      return;
    }
    toast({ title: 'Danke für deine Meldung', description: 'Wir prüfen den Inhalt so schnell wie möglich.' });
    setNote('');
    setReason(reasons[0].value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReview ? 'Bewertung melden' : 'Inhalt melden'}</DialogTitle>
          <DialogDescription>
            {isReview
              ? 'Melde nur Regelverstöße – eine schlechte Note allein ist kein Grund. Deine Meldung ist anonym.'
              : 'Warum möchtest du diesen Inhalt melden? Deine Meldung ist anonym.'}
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as Reason)} className="space-y-2">
          {reasons.map((r) => (
            <div key={r.value} className="flex items-center gap-3">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="cursor-pointer text-sm font-normal">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Textarea
          placeholder="Zusätzliche Details (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Wird gesendet…' : 'Melden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
