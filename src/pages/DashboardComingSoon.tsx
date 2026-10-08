import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import VenueDashboard from './VenueDashboard';

const Equalizer = () => (
  <div className="flex h-16 items-end gap-1.5" aria-hidden>
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.span
        key={i}
        className="w-2.5 rounded-full"
        style={{ background: 'linear-gradient(180deg, #EC4899, #7C3AED)' }}
        animate={{ height: [12, 56, 20, 44, 12] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/** Approved venues see the dashboard; pending/rejected venues get the status + waitlist page. */
export default function DashboardComingSoon() {
  const { user } = useAuth();
  const { data: status, isLoading } = useQuery({
    queryKey: ['my-venue-status', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('venue_members')
        .select('venues(verification_status)')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      const v = (data as any)?.venues;
      return (Array.isArray(v) ? v[0] : v)?.verification_status as string | undefined;
    },
  });
  if (isLoading) return null;
  if (status === 'approved') return <VenueDashboard />;
  return <ComingSoon status={status} />;
}

function ComingSoon({ status }: { status?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: onList } = useQuery({
    queryKey: ['venue-waitlist', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('venue_waitlist').select('id').eq('user_id', user!.id).maybeSingle();
      return !!data;
    },
  });

  const join = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('venue_waitlist').insert({ user_id: user!.id });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-waitlist', user?.id] }),
    onError: () => toast({ variant: 'destructive', title: 'Hat nicht geklappt', description: 'Versuch es gleich nochmal.' }),
  });

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6" style={{ background: '#0A0A0F' }}>
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[120px]" style={{ background: 'rgba(124,58,237,0.35)' }} />
      <button onClick={() => navigate(-1)} aria-label="Zurück" className="relative z-10 mt-4 flex h-10 w-10 items-center justify-center">
        <CaretLeft size={24} color="rgba(255,255,255,0.7)" />
      </button>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center"
      >
        <Equalizer />
        <h1 className="mt-8 text-[34px] font-bold leading-tight tracking-tight sm:text-5xl" style={{ color: '#fff' }}>
          Unser Dashboard steht noch in der Schlange vorm Türsteher. 🕺
        </h1>
        <span className="mt-6 rounded-full px-4 py-1.5 text-sm" style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)' }}>
          {status === 'rejected' ? 'Verifizierung abgelehnt – schreib uns, wir klären das.' : 'Verifizierung läuft ⏳'}
        </span>
        <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Keine Sorge – wir kennen den DJ. Bald siehst du hier, wer wann bei dir feiert.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={onList || join.isPending}
          onClick={() => join.mutate()}
          className="mt-10 rounded-full px-8 py-4 text-base font-semibold transition-shadow hover:shadow-[0_0_40px_rgba(236,72,153,0.55)] disabled:cursor-default"
          style={{
            color: '#fff',
            background: onList ? 'rgba(255,255,255,0.08)' : 'linear-gradient(90deg, #7C3AED, #EC4899)',
            border: onList ? '0.5px solid rgba(255,255,255,0.2)' : 'none',
            backdropFilter: 'blur(12px)',
          }}
        >
          {onList ? 'Du bist auf der Liste ✓' : join.isPending ? '…' : 'Early Access sichern'}
        </motion.button>
      </motion.div>
    </div>
  );
}
