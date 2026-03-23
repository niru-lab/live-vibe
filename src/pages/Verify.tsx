import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { method, contact } = (location.state as { method: string; contact: string }) || {};

  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) navigate('/onboarding', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!contact) navigate('/register', { replace: true });
  }, [contact, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    setResending(true);
    if (method === 'email') {
      await supabase.auth.signInWithOtp({
        email: contact,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
    } else {
      await supabase.auth.signInWithOtp({ phone: contact });
    }
    setResending(false);
    setCountdown(60);
  };

  const isEmail = method === 'email';

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6" style={{ background: '#08080f' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex w-full max-w-[340px] flex-col items-center text-center"
      >
        {/* Icon */}
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: '#1a1a30', border: '0.5px solid #2a2a3a' }}
        >
          {isEmail ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 7L2 7" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          )}
        </div>

        <h1 className="mb-2 text-xl font-bold text-white">
          {isEmail ? 'Check deine Mails!' : 'Schau aufs Handy!'}
        </h1>
        <p className="mb-6 text-sm" style={{ color: '#888' }}>
          {isEmail
            ? `Wir haben einen Link an ${contact} geschickt. Klick auf den Link — und du bist drin.`
            : `Wir haben einen Code an ${contact} geschickt.`}
        </p>

        {/* Preview Card */}
        {isEmail && (
          <div
            className="mb-6 w-full rounded-2xl p-4 text-left"
            style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full" style={{ background: '#7F77DD' }} />
              <span className="text-xs font-medium text-white">Feyrn</span>
            </div>
            <p className="text-xs" style={{ color: '#888' }}>
              Klicke hier um dich bei Feyrn anzumelden:
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: '#7F77DD' }}>
              feyrn.app/auth/verify?token=•••••
            </p>
          </div>
        )}

        <p className="mb-6 text-xs" style={{ color: '#555' }}>
          Link gültig für 15 Minuten
        </p>

        {countdown > 0 ? (
          <p className="text-xs" style={{ color: '#555' }}>
            Erneut senden ({countdown}s)
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium"
            style={{ color: '#9d97e8' }}
          >
            {resending ? 'Wird gesendet...' : 'Noch keine Mail? Erneut senden'}
          </button>
        )}
      </motion.div>
    </div>
  );
}
