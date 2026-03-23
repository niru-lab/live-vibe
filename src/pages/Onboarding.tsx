import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from '@phosphor-icons/react';

const VIBES = [
  'Techno', 'House', 'Hip-Hop', 'R&B',
  'Afrobeats', 'Latin', 'Pop', 'Drum & Bass',
];

const CITIES = [
  'Stuttgart', 'Berlin', 'München', 'Hamburg', 'Köln',
  'Frankfurt', 'Düsseldorf', 'Wien', 'Zürich', 'Leipzig',
];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [city, setCity] = useState('Stuttgart');
  const [citySearch, setCitySearch] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }
    if (user) {
      // Check if profile exists and if onboarding is already done
      supabase
        .from('profiles')
        .select('id, username, onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.onboarding_complete) {
            navigate('/', { replace: true });
          } else if (data) {
            setProfileId(data.id);
            if (data.username) setUsername(data.username);
          }
        });
    }
  }, [user, authLoading, navigate]);

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('user_id', user?.id ?? '')
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [username, user?.id]);

  const toggleVibe = (v: string) => {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 3 ? [...prev, v] : prev
    );
  };

  const canProceed =
    step === 1 ? username.length >= 3 && usernameStatus === 'available' :
    step === 2 ? !!city :
    vibes.length > 0;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = async () => {
    if (!profileId) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        username,
        city,
        vibes,
        onboarding_complete: true,
      } as any)
      .eq('id', profileId);
    setSaving(false);
    navigate('/', { replace: true });
  };

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

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

  if (authLoading) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col px-6 pt-14" style={{ background: '#08080f' }}>
      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-2 w-2 rounded-full transition-all"
            style={{
              background: s === step ? '#7F77DD' : s < step ? '#9d97e8' : '#2a2a3a',
              width: s === step ? 24 : 8,
            }}
          />
        ))}
      </div>

      {/* Success Header (only on step 1) */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 text-center"
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(34, 197, 94, 0.15)' }}
          >
            <Check size={24} weight="bold" color="#22c55e" />
          </div>
          <h1 className="mb-1 text-xl font-bold text-white">Du bist dabei! 🎉</h1>
          <p className="text-sm" style={{ color: '#888' }}>
            Willkommen bei Feyrn. Sehen wir, was heute Nacht geht.
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <label className="mb-2 block text-sm font-semibold text-white">
              Wähle deinen Feyrn-Namen
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#888' }}>@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                style={{ ...inputStyle, paddingLeft: 28 }}
                maxLength={20}
                onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')}
              />
              {usernameStatus === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                </span>
              )}
              {usernameStatus === 'available' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={18} weight="bold" color="#22c55e" />
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={18} weight="bold" color="#ff6b6b" />
                </span>
              )}
            </div>
            {usernameStatus === 'taken' && (
              <p className="mt-1 text-xs" style={{ color: '#ff6b6b' }}>Dieser Name ist schon vergeben</p>
            )}
            <p className="mt-2 text-xs" style={{ color: '#555' }}>
              Einmal gesetzt, bleibt er.
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <label className="mb-2 block text-sm font-semibold text-white">
              Wo gehst du feiern?
            </label>
            <input
              type="text"
              placeholder="Stadt suchen..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              style={inputStyle}
              className="mb-3"
              onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a3a')}
            />
            <div className="flex flex-wrap gap-2">
              {filteredCities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    background: city === c ? '#7F77DD' : 'transparent',
                    color: city === c ? '#fff' : '#888',
                    border: `0.5px solid ${city === c ? '#7F77DD' : '#2a2a3a'}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs" style={{ color: '#555' }}>
              Für deinen persönlichen Live-Feed
            </p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <label className="mb-2 block text-sm font-semibold text-white">
              Was ist dein Sound?
            </label>
            <p className="mb-4 text-xs" style={{ color: '#888' }}>
              Wähle bis zu 3
            </p>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const selected = vibes.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggleVibe(v)}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: selected ? '#7F77DD' : 'transparent',
                      color: selected ? '#fff' : '#888',
                      border: `0.5px solid ${selected ? '#7F77DD' : '#2a2a3a'}`,
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Button */}
      <div className="mt-auto pb-10 pt-6">
        <button
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          style={{ background: '#7F77DD' }}
        >
          {saving ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : step === 3 ? (
            'Zum Live-Feed →'
          ) : (
            'Weiter →'
          )}
        </button>
      </div>
    </div>
  );
}
