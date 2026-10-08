import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const SHOWN_KEY = 'feyrn-push-primed';
export const FIRST_RSVP_EVENT = 'feyrn:rsvp-set';

/** Call after a successful RSVP. Shows the priming screen once, native only. */
export const notifyRsvpForPush = () => {
  if (!Capacitor.isNativePlatform()) return;
  if (localStorage.getItem(SHOWN_KEY)) return;
  window.dispatchEvent(new Event(FIRST_RSVP_EVENT));
};

/**
 * Push permission is never requested on app start. After the first RSVP we
 * explain the value first; only on "Ja" the native prompt appears.
 */
export const PushPrimer = () => {
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => {
      if (localStorage.getItem(SHOWN_KEY)) return;
      localStorage.setItem(SHOWN_KEY, '1');
      setOpen(true);
    };
    window.addEventListener(FIRST_RSVP_EVENT, show);
    return () => window.removeEventListener(FIRST_RSVP_EVENT, show);
  }, []);

  const accept = async () => {
    setOpen(false);
    if (!Capacitor.isNativePlatform() || !profile) return;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;
      await PushNotifications.addListener('registration', async ({ value }) => {
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        await supabase.from('push_tokens').upsert(
          { profile_id: profile.id, token: value, platform, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'token' },
        );
      });
      await PushNotifications.register();
    } catch (e) {
      console.warn('Push registration failed', e);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            className="w-full max-w-md rounded-3xl border border-border/50 bg-card/90 p-6 text-center backdrop-blur-xl"
          >
            <div className="mb-3 text-4xl">🔔</div>
            <h2 className="text-lg font-bold text-foreground">Sollen wir dich erinnern, wenn's losgeht? 🔔</h2>
            <p className="mt-2 text-sm text-muted-foreground">Nur bei deinen Events und Nachrichten. Du kannst das jederzeit im Profil ändern.</p>
            <button
              onClick={accept}
              className="mt-6 w-full rounded-full py-3.5 font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }}
            >
              Ja, erinnere mich
            </button>
            <button onClick={() => setOpen(false)} className="mt-2 w-full py-2 text-sm text-muted-foreground">
              Später
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
