import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export type ReportTarget = 'post' | 'profile' | 'room' | 'event' | 'message' | 'comment';

const REASONS: { value: 'spam' | 'harassment' | 'nudity' | 'violence' | 'illegal' | 'other'; label: string }[] = [
  { value: 'spam', label: 'Spam oder Werbung' },
  { value: 'harassment', label: 'Belästigung oder Hass' },
  { value: 'nudity', label: 'Nacktheit / sexuelle Inhalte' },
  { value: 'violence', label: 'Gewalt oder Bedrohung' },
  { value: 'illegal', label: 'Illegale Aktivität' },
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
  const [reason, setReason] = useState<typeof REASONS[number]['value']>('spam');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: profile.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      note: note.trim() || null,
    });
    setLoading(false);
    if (error && !error.message.includes('duplicate')) {
      toast({ variant: 'destructive', title: 'Fehler', description: error.message });
      return;
    }
    toast({ title: 'Danke für deine Meldung', description: 'Wir prüfen den Inhalt so schnell wie möglich.' });
    setNote('');
    setReason('spam');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inhalt melden</DialogTitle>
          <DialogDescription>
            Warum möchtest du diesen Inhalt melden? Deine Meldung ist anonym.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as any)} className="space-y-2">
          {REASONS.map((r) => (
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
