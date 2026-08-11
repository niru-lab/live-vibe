import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { appUrl } from '@/lib/appUrl';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/lib/authRouting';
import { motion } from 'framer-motion';

type Status = 'idle' | 'verifying' | 'error';

const CONTACT_KEY = 'feyrn.verify.contact';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  const state = (location.state as { method?: string; contact?: string; mode?: 'login' | 'register' }) || {};

  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(CONTACT_KEY) || 'null') as
        | { method?: string; contact?: string; mode?: 'login' | 'register' }
        | null;
    } catch {
      return null;
    }
  })();

  const method = state.method || stored?.method || 'email';
  const contact = state.contact || stored?.contact || '';
  const mode = state.mode || stored?.mode;

  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const routed = useRef(false);

  // Persist contact so a refresh on /verify keeps the resend action usable.
  useEffect(() => {
    if (state.contact) {
      sessionStorage.setItem(CONTACT_KEY, JSON.stringify({ method: state.method, contact: state.contact, mode: state.mode }));
    }
  }, [state.contact, state.method, state.mode]);

  const routeForward = useCallback(
    async (u: NonNullable<typeof user>) => {
      if (routed.current) return;
      routed.current = true;
      sessionStorage.removeItem(CONTACT_KEY);
      try {
        const route = await resolvePostAuthRoute(u);
        navigate(route, { replace: true });
      } catch {
        navigate('/role', { replace: true });
      }
    },
    [navigate],
  );

  // 1) Handle explicit error params from the email link
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const err = searchParams.get('error_description') || searchParams.get('error') || hash.get('error_description') || hash.get('error');
    if (err) {
      setStatus('error');
      setErrorMessage(
        /expired|invalid/i.test(err)
          ? 'Dieser Link ist abgelaufen oder ungültig.'
          : decodeURIComponent(err),
      );
    }
  }, [searchParams]);

  // 2) PKCE / token_hash style links need an explicit exchange
  useEffect(() => {
    const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
    const type = searchParams.get('type');
    const code = searchParams.get('code');
    if (!tokenHash && !code) return;
    if (status === 'error') return;

    let cancelled = false;
    setStatus('verifying');

    (async () => {
      let failed: string | null = null;
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) failed = error.message;
      } else if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: ((type as any) || 'magiclink'),
          token_hash: tokenHash,
        });
        if (error) failed = error.message;
      }
      if (cancelled) return;
      if (failed) {
        setStatus('error');
        setErrorMessage(
          /expired|invalid/i.test(failed) ? 'Dieser Link ist abgelaufen oder ungültig.' : failed,
        );
      } else {
        setStatus('idle');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 3) Once a session exists (either already, or after exchange), route forward
  useEffect(() => {
    if (loading || !user) return;
    routeForward(user);
  }, [user, loading, routeForward]);

  // 4) Nothing to wait for and nothing to verify -> back to register
  useEffect(() => {
    if (loading || user) return;
    if (contact || status !== 'idle') return;
    if (searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('code')) return;
    if (window.location.hash.includes('access_token')) return;
    const t = setTimeout(() => navigate('/register', { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [contact, status, loading, user, navigate, searchParams]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (!contact || resending) return;
    setResending(true);
    setResendMessage(null);
    const { error } =
      method === 'email'
        ? await supabase.auth.signInWithOtp({
            email: contact,
            options: {
              emailRedirectTo: appUrl('/verify'),
              shouldCreateUser: mode === 'register',
            },
          })
        : await supabase.auth.signInWithOtp({ phone: contact, options: { shouldCreateUser: mode === 'register' } });
    setResending(false);
    if (error) {
      setResendMessage(
        /rate|limit/i.test(error.message)
          ? 'Zu viele Versuche. Warte kurz und probier es erneut.'
          : error.message,
      );
      return;
    }
    setStatus('idle');
    setErrorMessage(null);
    setCountdown(60);
    setResendMessage('Neuer Link wurde gesendet ✓');
  };

  const isEmail = method === 'email';

  if (status === 'verifying' || (user && !routed.current)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#08080f' }}>
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
      </div>
    );
  }

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
          {status === 'error' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16.5v.01" />
            </svg>
          ) : isEmail ? (
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

        {status === 'error' ? (
          <>
            <h1 className="mb-2 text-xl font-bold text-white">Link nicht mehr gültig</h1>
            <p className="mb-6 text-sm" style={{ color: '#888' }}>
              {errorMessage || 'Dieser Link ist abgelaufen oder ungültig.'}
              {contact ? ' Fordere einfach einen neuen an.' : ' Starte die Anmeldung bitte neu.'}
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-xl font-bold text-white">
              {isEmail ? 'Check deine Mails!' : 'Schau aufs Handy!'}
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#888' }}>
              {isEmail
                ? `Wir haben einen ${mode === 'register' ? 'Registrierungslink' : 'Login-Link'} an ${contact} geschickt.`
                : `Wir haben einen ${mode === 'register' ? 'Registrierungscode' : 'Login-Code'} an ${contact} geschickt.`}
            </p>

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
                  feyrn.app/verify?token=•••••
                </p>
              </div>
            )}

            <p className="mb-6 text-xs" style={{ color: '#555' }}>
              Link gültig für 15 Minuten
            </p>
          </>
        )}

        {resendMessage && (
          <p className="mb-3 text-xs" style={{ color: resendMessage.includes('✓') ? '#7F77DD' : '#ff6b6b' }}>
            {resendMessage}
          </p>
        )}

        {!contact ? (
          <button
            onClick={() => navigate('/register', { replace: true })}
            className="text-sm font-medium"
            style={{ color: '#9d97e8' }}
          >
            Zurück zur Anmeldung
          </button>
        ) : countdown > 0 && status !== 'error' ? (
          <p className="text-xs" style={{ color: '#555' }}>
            Erneut senden ({countdown}s)
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="text-sm font-medium disabled:opacity-40"
            style={{ color: '#9d97e8' }}
          >
            {resending
              ? 'Wird gesendet...'
              : countdown > 0
                ? `Erneut senden (${countdown}s)`
                : 'Noch keine Mail? Erneut senden'}
          </button>
        )}
      </motion.div>
    </div>
  );
}
