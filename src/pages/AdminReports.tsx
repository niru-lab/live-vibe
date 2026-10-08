import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const REASONS: Record<string, string> = {
  spam: 'Spam', harassment: 'Belästigung', nudity: 'Nacktheit', violence: 'Gewalt', illegal: 'Illegal', other: 'Sonstiges',
};

export default function AdminReports() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-reports'] });
  const onError = (e: Error) => toast({ variant: 'destructive', title: 'Fehler', description: e.message });

  const hide = useMutation({
    mutationFn: async ({ postId, reportId }: { postId: string; reportId: string }) => {
      const { error } = await supabase.rpc('admin_hide_post', { _post_id: postId, _report_id: reportId });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: 'Post ausgeblendet' }); refresh(); },
    onError,
  });

  const resolve = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'reviewed' | 'dismissed' }) => {
      const { error } = await supabase.rpc('admin_resolve_report', { _report_id: id, _status: status });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-10">
      <header className="flex items-center gap-2 py-3">
        <button onClick={() => navigate(-1)} aria-label="Zurück" className="flex h-10 w-10 items-center justify-center"><CaretLeft size={24} /></button>
        <h1 className="text-lg font-bold text-foreground">Meldungen</h1>
      </header>
      {isLoading && <p className="text-sm text-muted-foreground">Lädt…</p>}
      {!isLoading && !reports?.length && <p className="text-sm text-muted-foreground">Keine offenen Meldungen. 🎉</p>}
      <div className="space-y-3">
        {reports?.map((r) => (
          <div key={r.id} className="space-y-2 rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{REASONS[r.reason] ?? r.reason} · {r.target_type}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('de-DE')}</span>
            </div>
            {r.note && <p className="text-sm text-muted-foreground">„{r.note}"</p>}
            <p className="break-all text-[11px] text-muted-foreground">ID: {r.target_id}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {r.target_type === 'post' && (
                <Button size="sm" variant="destructive" disabled={hide.isPending} onClick={() => hide.mutate({ postId: r.target_id, reportId: r.id })}>Post ausblenden</Button>
              )}
              <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: r.id, status: 'reviewed' })}>Erledigt</Button>
              <Button size="sm" variant="ghost" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: r.id, status: 'dismissed' })}>Verwerfen</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
