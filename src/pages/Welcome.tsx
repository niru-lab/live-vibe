import { useNavigate } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import { motion } from 'framer-motion';
import { oauthRedirectUrl } from '@/lib/appUrl';

export default function Welcome() {
  const navigate = useNavigate();

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: oauthRedirectUrl('/auth/callback'),
    });
    if (error) console.error('Google auth error:', error);
  };

  const handleApple = async () => {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: oauthRedirectUrl('/auth/callback'),
    });
    if (error) console.error('Apple auth error:', error);
  };

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: '#08080f' }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--neon-purple)) 0%, transparent 70%)' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full opacity-20 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #ff4d8d 0%, transparent 70%)' }}
        animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-28 top-1/3 h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #4d9fff 0%, transparent 70%)' }}
        animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex w-full max-w-[340px] flex-col items-center rounded-3xl px-7 py-10"
        style={{
          background: 'rgba(17, 17, 32, 0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '0.5px solid rgba(127, 119, 221, 0.28)',
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px -30px rgba(127,119,221,0.35)',
        }}
      >
        {/* Logo */}
        <motion.div
          className="mb-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div
            className="rounded-xl p-1"
            style={{
              background: 'rgba(127, 119, 221, 0.15)',
              border: '0.5px solid rgba(127, 119, 221, 0.35)',
              boxShadow: '0 0 24px -4px rgba(127,119,221,0.5)',
            }}
          >
            <img src="/icon-192.png" alt="Feyrn" className="h-8 w-8 rounded-lg" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">
            <span style={{ color: '#ffffff' }}>feyr</span>
            <span style={{ color: 'hsl(var(--neon-purple))' }}>n</span>
          </span>
        </motion.div>
        <p className="mb-6 text-sm" style={{ color: '#888888' }}>
          Wo die Party beginnt
        </p>

        {/* Badges */}
        <div className="mb-9 flex gap-2">
          {['Stuttgart', 'Echtzeit', 'Gen-Z'].map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: 'rgba(127, 119, 221, 0.12)',
                color: '#9d97e8',
                border: '0.5px solid rgba(127, 119, 221, 0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Auth Buttons */}
        <motion.button
          onClick={handleGoogle}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="group mb-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-shadow duration-300"
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#1a1a1a',
            boxShadow: '0 0 0 0 rgba(255,255,255,0)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 0 28px -4px rgba(255,255,255,0.45), 0 8px 24px -8px rgba(0,0,0,0.5)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Mit Google anmelden
        </motion.button>

        <motion.button
          onClick={handleApple}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300"
          style={{
            background: 'rgba(26, 26, 26, 0.7)',
            color: '#ffffff',
            border: '0.5px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 0 0 rgba(127,119,221,0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              '0 0 28px -4px rgba(127,119,221,0.55), 0 8px 24px -8px rgba(0,0,0,0.5)';
            e.currentTarget.style.border = '0.5px solid rgba(127,119,221,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(127,119,221,0)';
            e.currentTarget.style.border = '0.5px solid rgba(255,255,255,0.14)';
          }}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
            <path d="M13.1 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.04 1.4-.7 2.6-.7 1.2 0 1.6.7 2.6.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.1h.3zM11 3.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.7-.5 2.3-1.1z"/>
          </svg>
          Mit Apple anmelden
        </motion.button>

        {/* Divider */}
        <div className="my-4 flex w-full items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #2a2a3a)' }} />
          <span className="text-xs" style={{ color: '#888888' }}>oder</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #2a2a3a, transparent)' }} />
        </div>

        <div className="flex w-full flex-col gap-3">
          <motion.button
            onClick={() => navigate('/register?mode=login')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300"
            style={{
              color: '#ffffff',
              border: '0.5px solid rgba(127, 119, 221, 0.35)',
              background: 'rgba(127, 119, 221, 0.12)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 0 0 rgba(127,119,221,0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 32px -4px rgba(127,119,221,0.6), inset 0 0 20px rgba(127,119,221,0.12)';
              e.currentTarget.style.background = 'rgba(127, 119, 221, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(127,119,221,0)';
              e.currentTarget.style.background = 'rgba(127, 119, 221, 0.12)';
            }}
          >
            Mit E-Mail oder Nummer anmelden
          </motion.button>
          <button
            onClick={() => navigate('/register?mode=register')}
            className="w-full px-4 py-2 text-xs transition-all duration-300 hover:tracking-wide"
            style={{ color: '#9d97e8', textShadow: '0 0 0 transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.textShadow = '0 0 12px rgba(157,151,232,0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.textShadow = '0 0 0 transparent')}
          >
            Noch kein Account? Registrieren
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px]" style={{ color: '#555' }}>
          Durch Anmelden stimmst du den{' '}
          <span style={{ color: '#9d97e8' }}>Nutzungsbedingungen</span> zu.
        </p>
      </motion.div>
    </div>
  );
}
