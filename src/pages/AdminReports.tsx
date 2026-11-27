import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdminReviews, useModerateReview, type ReviewModerationAction } from '@/hooks/useReviews';

const REASONS: Record<string, string> = {
  spam: 'Spam', harassment: 'Belästigung', nudity: 'Nacktheit', violence: 'Gewalt', illegal: 'Illegal', other: 'Sonstiges',
  fake: 'Fake-Besuch', personal_data: 'Private Daten',
};
const TARGETS: Record<string, string> = {
  post: 'Post', profile: 'Profil', room: 'Room', event: 'Event', message: 'Nachricht', comment: 'Kommentar', review: 'Bewertung',
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
  // target_type 'review' comes from migration 0009 (not in generated enum types yet).
  const reviewIds = [...new Set((reports ?? []).filter((r) => (r.target_type as string) === 'review').map((r) => r.target_id))];
  const { data: reviews = [] } = useAdminReviews(reviewIds);
  const reviewById = new Map(reviews.map((rv) => [rv.review_id, rv]));
  const moderate = useModerateReview();
  const moderateReview = (reviewId: string, action: ReviewModerationAction, reason?: string) =>
    moderate.mutate({ reviewId, action, reason }, {
      onSuccess: () => toast({ title: action === 'remove' ? 'Bewertung entfernt, Punkte abgezogen' : action === 'hide_text' ? 'Text ausgeblendet' : 'Bewertung bleibt, Meldungen verworfen' }),
      onError,
    });
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
              <span className="text-sm font-semibold text-foreground">{REASONS[r.reason] ?? r.reason} · {TARGETS[r.target_type] ?? r.target_type}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('de-DE')}</span>
            </div>
            {r.note && <p className="text-sm text-muted-foreground">„{r.note}"</p>}
            <p className="break-all text-[11px] text-muted-foreground">ID: {r.target_id}</p>
            {(r.target_type as string) === 'review' && (() => {
              const rv = reviewById.get(r.target_id);
              if (!rv) return null;
              return (
                <div className="rounded-xl bg-muted/60 p-3 text-sm" data-testid="admin-review">
                  <p className="font-semibold">{'★'.repeat(rv.rating_overall)}{'☆'.repeat(5 - rv.rating_overall)} · {rv.venue_name} · @{rv.author_username}</p>
                  {rv.comment ? <p className="mt-1 whitespace-pre-wrap">„{rv.comment}"</p> : <p className="mt-1 italic text-muted-foreground">Kein Text</p>}
                  {rv.reply_text && <p className="mt-1 text-xs text-muted-foreground">Antwort Venue: „{rv.reply_text}"</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Meldungen: {rv.guest_reports} von Gästen · {rv.venue_reports} von Venue-Seite
                    {rv.comment_hidden ? ' · Text automatisch ausgeblendet' : ''}{rv.status === 'removed' ? ' · bereits entfernt' : ''}
                  </p>
                </div>
              );
            })()}
            <div className="flex flex-wrap gap-2 pt-1">
              {r.target_type === 'post' && (
                <Button size="sm" variant="destructive" disabled={hide.isPending} onClick={() => hide.mutate({ postId: r.target_id, reportId: r.id })}>Post ausblenden</Button>
              )}
              {(r.target_type as string) === 'review' ? (
                <>
                  <Button size="sm" variant="destructive" disabled={moderate.isPending} onClick={() => moderateReview(r.target_id, 'remove', REASONS[r.reason] ?? r.reason)}>Bewertung entfernen</Button>
                  <Button size="sm" variant="outline" disabled={moderate.isPending} onClick={() => moderateReview(r.target_id, 'hide_text')}>Nur Text ausblenden</Button>
                  <Button size="sm" variant="ghost" disabled={moderate.isPending} onClick={() => moderateReview(r.target_id, 'keep')}>Bleibt (Meldungen verwerfen)</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: r.id, status: 'reviewed' })}>Erledigt</Button>
                  <Button size="sm" variant="ghost" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: r.id, status: 'dismissed' })}>Verwerfen</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
