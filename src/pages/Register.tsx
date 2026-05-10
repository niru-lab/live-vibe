import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { z } from 'zod';

const emailSchema = z.string().email('Bitte gib eine gültige E-Mail ein');
const phoneSchema = z.string().min(6, 'Bitte gib eine gültige Nummer ein');

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode] = useState('+49');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: mode === 'register',
      },
    });
    setLoading(false);
    if (authError) {
      const msg = authError.message?.toLowerCase() || '';
      if (msg.includes('rate') || msg.includes('limit')) {
        setError('Zu viele Versuche. Warte kurz und probier es erneut.');
      } else if (msg.includes('signup') || msg.includes('not allowed')) {
        setError(mode === 'login' ? 'Für diese E-Mail gibt es noch keinen Account. Bitte registrieren.' : 'Registrierung mit dieser E-Mail aktuell nicht möglich.');
      } else {
        setError(authError.message);
      }
    } else {
      navigate('/verify', { state: { method: 'email', contact: email, mode } });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullPhone = `${countryCode}${phone.replace(/^0/, '')}`;
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: { shouldCreateUser: mode === 'register' },
    });
    setLoading(false);
    if (authError) {
      const msg = authError.message?.toLowerCase() || '';
      if (msg.includes('sms') || msg.includes('phone')) {
        setError('SMS-Anmeldung aktuell nicht verfügbar. Nutze stattdessen E-Mail.');
      } else {
        setError(authError.message);
      }
    } else {
      navigate('/verify', { state: { method: 'phone', contact: fullPhone, mode } });
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#111120',
    border: '0.5px solid #2a2a3a',
    borderRadius: 10,
    color: '#fff',
    padding: '12px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 pt-14" style={{ background: '#08080f' }}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm"
          style={{ color: '#888' }}
        >
          <ArrowLeft size={18} weight="bold" />
        </button>

        <h1 className="mb-2 text-xl font-bold text-white">{mode === 'login' ? 'Einloggen' : 'Konto erstellen'}</h1>
        <p className="mb-6 text-sm" style={{ color: '#888' }}>
          {mode === 'login'
            ? 'Melde dich mit deiner bestehenden E-Mail oder Nummer an.'
            : 'Registriere dich mit E-Mail oder Nummer — kein Passwort nötig.'}
        </p>

        <div
          className="mb-3 flex rounded-xl p-1"
          style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
              style={{
                background: mode === m ? '#7F77DD' : 'transparent',
                color: mode === m ? '#fff' : '#888',
              }}
            >
              {m === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        {/* Tab Switcher */}
        <div
          className="mb-6 flex rounded-xl p-1"
          style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
        >
          {(['email', 'phone'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
              style={{
                background: tab === t ? '#7F77DD' : 'transparent',
                color: tab === t ? '#fff' : '#888',
              }}
            >
              {t === 'email' ? 'E-Mail' : 'Nummer'}
            </button>
          ))}
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')}
            />
            {error && <p className="text-xs" style={{ color: '#ff6b6b' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#7F77DD' }}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                mode === 'login' ? 'Login-Link senden →' : 'Registrierungslink senden →'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div
                className="flex items-center rounded-xl px-3 text-sm text-white"
                style={{ background: '#111120', border: '0.5px solid #2a2a3a', minWidth: 60 }}
              >
                {countryCode}
              </div>
              <input
                type="tel"
                placeholder="1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')}
              />
            </div>
            {error && <p className="text-xs" style={{ color: '#ff6b6b' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#7F77DD' }}
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                mode === 'login' ? 'Login-Code senden →' : 'Registrierungscode senden →'
              )}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs" style={{ color: '#555' }}>
          Magic Link per Mail oder OTP per SMS. Einmal klicken — fertig.
        </p>
      </motion.div>
    </div>
  );
}
