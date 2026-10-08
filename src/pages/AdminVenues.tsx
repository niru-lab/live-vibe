import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminVenues() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-pending-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase.rpc('admin_set_venue_status', { _venue_id: id, _status: status });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast({ title: v.status === 'approved' ? 'Venue freigegeben ✓' : 'Venue abgelehnt' });
      qc.invalidateQueries({ queryKey: ['admin-pending-venues'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Fehler', description: e.message }),
  });

  const Field = ({ label, value }: { label: string; value?: string | number | null }) =>
    value ? (
      <div className="text-sm"><span className="text-muted-foreground">{label}: </span><span className="text-foreground break-all">{value}</span></div>
    ) : null;

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-10">
      <header className="flex items-center gap-2 py-3">
        <button onClick={() => navigate(-1)} aria-label="Zurück" className="flex h-10 w-10 items-center justify-center"><CaretLeft size={24} /></button>
        <h1 className="text-lg font-bold text-foreground">Venues prüfen</h1>
      </header>
      {isLoading && <p className="text-sm text-muted-foreground">Lädt…</p>}
      {!isLoading && !venues?.length && <p className="text-sm text-muted-foreground">Keine offenen Anfragen. 🎉</p>}
      <div className="space-y-3">
        {venues?.map((v) => (
          <div key={v.id} className="space-y-2 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              {v.logo_url && <img src={v.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
              <div>
                <p className="font-semibold text-foreground">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.venue_type || v.category} · seit {new Date(v.created_at).toLocaleDateString('de-DE')}</p>
              </div>
            </div>
            <Field label="Adresse" value={v.address} />
            <Field label="Kapazität" value={v.capacity} />
            <Field label="Ansprechpartner" value={v.contact_name} />
            <Field label="Telefon" value={v.phone} />
            <Field label="Impressum" value={v.imprint_url} />
            <Field label="Handelsregister" value={v.register_number} />
            <Field label="Website" value={v.website} />
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: v.id, status: 'approved' })}>Freigeben</Button>
              <Button className="flex-1" variant="outline" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: v.id, status: 'rejected' })}>Ablehnen</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
