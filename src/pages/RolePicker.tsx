import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Role = 'guest' | 'venue_owner';

export default function RolePicker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState<Role | null>(null);

  const pick = async (role: Role) => {
    if (!user || saving) return;
    setSaving(role);
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('user_id', user.id);
    setSaving(null);
    if (error) {
      toast({ variant: 'destructive', title: 'Fehler', description: error.message });
      return;
    }
    navigate(role === 'venue_owner' ? '/onboarding-venue' : '/onboarding', { replace: true });
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex w-full max-w-md flex-col items-center"
      >
        <div className="mb-8">
          <FeyrnLogo size="lg" asLink={false} />
        </div>

        <h1
          className="mb-2 text-center font-bold text-foreground"
          style={{ fontSize: 28, letterSpacing: '-0.01em' }}
        >
          Wer bist du?
        </h1>
        <p
          className="mb-8 text-center"
          style={{ fontSize: 15, color: 'hsl(var(--foreground) / 0.6)' }}
        >
          Sag uns, wie du Feyrn nutzen willst
        </p>

        <div className="flex w-full flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!!saving}
            onClick={() => pick('guest')}
            className="group w-full rounded-[20px] border border-border/50 bg-card/80 p-6 text-left backdrop-blur-xl transition-shadow hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)] disabled:opacity-50"
          >
            <div className="mb-3 text-[32px] leading-none">🎉</div>
            <div className="text-[20px] font-bold text-foreground">
              {saving === 'guest' ? 'Wird gespeichert…' : 'Ich will rausgehen'}
            </div>
            <div className="mt-1 text-[14px]" style={{ color: 'hsl(var(--foreground) / 0.6)' }}>
              Zeig mir, wo heute was geht
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!!saving}
            onClick={() => pick('venue_owner')}
            className="group w-full rounded-[20px] border border-border/50 bg-card/80 p-6 text-left backdrop-blur-xl transition-shadow hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)] disabled:opacity-50"
          >
            <div className="mb-3 text-[32px] leading-none">🏛️</div>
            <div className="text-[20px] font-bold text-foreground">
              {saving === 'venue_owner' ? 'Wird gespeichert…' : 'Ich BIN der Spot'}
            </div>
            <div className="mt-1 text-[14px]" style={{ color: 'hsl(var(--foreground) / 0.6)' }}>
              Du bringst die Leute, wir die Reichweite
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
