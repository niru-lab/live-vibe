import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from '@phosphor-icons/react';
import OnboardingLayout from './OnboardingLayout';

const SPOT_TYPES = [
  { emoji: '🎧', label: 'Club' },
  { emoji: '🍸', label: 'Bar' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🏀', label: 'Sport Events' },
  { emoji: '🌆', label: 'Rooftop' },
  { emoji: '🎪', label: 'Festival' },
  { emoji: '🏠', label: 'House Party' },
  { emoji: '🌿', label: 'Lounge' },
];

const MUSIC = ['Techno', 'House', 'Hip-Hop', 'R&B', 'Afrobeats', 'Latin', 'Pop', 'Drum & Bass', 'Reggaeton', 'Indie', 'EDM', 'Alles'];

const DRINKS = [
  { emoji: '🍺', label: 'Bier' },
  { emoji: '🍹', label: 'Cocktail' },
  { emoji: '🥃', label: 'Whisky / Gin' },
  { emoji: '🍾', label: 'Champagner' },
  { emoji: '🧃', label: 'Alkoholfrei' },
  { emoji: '🥤', label: 'Softdrink' },
  { emoji: '✏️', label: 'Sonstiges' },
];

const VIBE_MAP = [
  { emoji: '😴', color: '#444', label: 'Wer feiert schon?' },
  { emoji: '🥱', color: '#555', label: 'Nur wenn ich muss' },
  { emoji: '🥱', color: '#555', label: 'Nur wenn ich muss' },
  { emoji: '😌', color: '#888', label: 'Manchmal ganz nett' },
  { emoji: '😌', color: '#888', label: 'Manchmal ganz nett' },
  { emoji: '😊', color: '#EF9F27', label: 'Bin dabei!' },
  { emoji: '😊', color: '#EF9F27', label: 'Bin dabei!' },
  { emoji: '🔥', color: '#D85A30', label: 'Fast jeden Abend' },
  { emoji: '🔥', color: '#D85A30', label: 'Fast jeden Abend' },
  { emoji: '⚡', color: '#7F77DD', label: 'Ich lebe die Nacht' },
  { emoji: '👑', color: '#9d97e8', label: 'Party ist mein Sport' },
];

const EVENINGS = [
  { emoji: '🔥', label: 'Durchfeiern bis morgens früh' },
  { emoji: '🎶', label: 'Gute Musik, entspannte Leute' },
  { emoji: '🍻', label: 'Vorglühen & dann weitersehen' },
  { emoji: '🌙', label: 'Draußen sitzen & Gespräche' },
];

const PERSONAS = [
  { color: '#E24B4A', bg: '#2a0f0f', name: 'Der Zünder', key: 'Rot', desc: 'Du bist der Grund warum der Abend eskaliert. Spontan, laut, unvergesslich.' },
  { color: '#EF9F27', bg: '#2a1a0a', name: 'Die Seele', key: 'Gelb', desc: 'Du hältst alles zusammen. Warm, sozial, jeder kennt dich.' },
  { color: '#4CAF50', bg: '#0f2a12', name: 'Der Vibes-Checker', key: 'Grün', desc: 'Du findest immer den besten Spot. Entspannt, curated, immer richtig.' },
  { color: '#378ADD', bg: '#0a1a2a', name: 'Der Silent Raver', key: 'Blau', desc: 'Du redest nicht viel — aber auf der Tanzfläche sagst du alles.' },
];

interface UserFlowProps {
  profileId: string;
  userId: string;
  initialUsername: string;
  onComplete: () => void;
}

export default function UserFlow({ profileId, userId, initialUsername, onComplete }: UserFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Answers
  const [username, setUsername] = useState(initialUsername);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [city, setCity] = useState('');
  const [age, setAge] = useState(22);
  const [spotTypes, setSpotTypes] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [drink, setDrink] = useState('');
  const [drinkOther, setDrinkOther] = useState('');
  const [vibeScore, setVibeScore] = useState(7);
  const [evening, setEvening] = useState('');
  const [personaColor, setPersonaColor] = useState('');
  const [personaText, setPersonaText] = useState('');

  const TOTAL = 9;

  // Username check
  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id').eq('username', username).neq('user_id', userId).maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(t);
  }, [username, userId]);

  const canProceed = (() => {
    switch (step) {
      case 1: return username.length >= 3 && usernameStatus === 'available';
      case 2: return city.length >= 2;
      default: return true; // optional steps always proceed
    }
  })();

  const isOptional = step >= 3;

  const goNext = () => {
    if (step === TOTAL) { handleComplete(); return; }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleComplete = async () => {
    setSaving(true);
    const favDrink = drink === 'Sonstiges' ? drinkOther : drink;
    await supabase.from('profiles').update({
      username,
      city,
      age,
      spot_types: spotTypes,
      music_genres: musicGenres,
      favorite_drink: favDrink || null,
      party_vibe_score: vibeScore,
      perfect_evening: evening || null,
      persona_color: personaColor || null,
      persona_text: personaText || null,
      vibes: musicGenres.slice(0, 3), // keep legacy vibes in sync
      onboarding_complete: true,
    } as any).eq('id', profileId);
    setSaving(false);
    onComplete();
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #2a2a3a',
    color: '#fff',
    padding: '12px 0',
    fontSize: 20,
    width: '100%',
    outline: 'none',
    fontWeight: 600,
  };

  const titles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Wie sollen wir dich nennen?', sub: 'Dein Feyrn-Name — einmalig & einzigartig.' },
    2: { title: 'In welcher Stadt feierst du?', sub: 'Für deinen persönlichen Live-Feed.' },
    3: { title: 'Wie alt bist du?', sub: 'Damit wir passende Events zeigen.' },
    4: { title: 'Was ist dein Spot?', sub: 'Mehrfachauswahl möglich.' },
    5: { title: 'Was ist dein Sound?', sub: 'Wähle bis zu 5.' },
    6: { title: 'Dein Lieblingsgetränk?', sub: 'Für exklusive Angebote vor Ort.' },
    7: { title: 'Wie gerne gehst du feiern?', sub: 'Zieh den Regler — sei ehrlich.' },
    8: { title: 'Dein perfekter Abend?', sub: 'Wähle eine Option.' },
    9: { title: 'Wer bist du auf einer Party?', sub: 'Wähle das was am meisten passt — oder schreib es selbst.' },
  };

  return (
    <OnboardingLayout
      step={step}
      totalSteps={TOTAL}
      title={titles[step].title}
      subtitle={titles[step].sub}
      canProceed={canProceed}
      saving={saving}
      isOptional={isOptional}
      onNext={goNext}
      onBack={step > 1 ? goBack : undefined}
      onSkip={isOptional ? goNext : undefined}
      direction={direction}
    >
      {/* Step 1: Username */}
      {step === 1 && (
        <div>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-semibold" style={{ color: '#888' }}>@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="deinname"
              style={{ ...inputStyle, paddingLeft: 24 }}
              maxLength={24}
              autoFocus
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />}
              {usernameStatus === 'available' && <Check size={20} weight="bold" color="#22c55e" />}
              {usernameStatus === 'taken' && <X size={20} weight="bold" color="#ff6b6b" />}
            </span>
          </div>
          {usernameStatus === 'taken' && <p className="mt-2 text-xs" style={{ color: '#ff6b6b' }}>Dieser Name ist schon vergeben</p>}
        </div>
      )}

      {/* Step 2: Stadt */}
      {step === 2 && (
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Stuttgart"
          style={inputStyle}
          autoFocus
        />
      )}

      {/* Step 3: Alter */}
      {step === 3 && (
        <div className="flex flex-col items-center pt-4">
          <div className="text-center">
            <span className="text-5xl font-bold" style={{ color: '#7F77DD' }}>{age}</span>
            <p className="mt-1 text-sm" style={{ color: '#888' }}>Jahre</p>
          </div>
          <input
            type="range"
            min={16}
            max={40}
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            className="mt-8 w-full accent-[#7F77DD]"
          />
          <div className="mt-2 flex w-full justify-between text-xs" style={{ color: '#555' }}>
            <span>16</span><span>40</span>
          </div>
        </div>
      )}

      {/* Step 4: Spot-Typ */}
      {step === 4 && (
        <div className="flex flex-wrap gap-2">
          {SPOT_TYPES.map(s => {
            const sel = spotTypes.includes(s.label);
            return (
              <button
                key={s.label}
                onClick={() => setSpotTypes(prev => sel ? prev.filter(x => x !== s.label) : [...prev, s.label])}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: sel ? '#7F77DD' : 'transparent',
                  color: sel ? '#fff' : '#888',
                  border: `0.5px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                }}
              >
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 5: Musik */}
      {step === 5 && (
        <div className="flex flex-wrap gap-2">
          {MUSIC.map(m => {
            const sel = musicGenres.includes(m);
            return (
              <button
                key={m}
                onClick={() => setMusicGenres(prev => {
                  if (sel) return prev.filter(x => x !== m);
                  if (prev.length >= 5) return prev;
                  return [...prev, m];
                })}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: sel ? '#7F77DD' : 'transparent',
                  color: sel ? '#fff' : '#888',
                  border: `0.5px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 6: Lieblingsgetränk */}
      {step === 6 && (
        <div>
          <div className="grid grid-cols-2 gap-2">
            {DRINKS.map(d => {
              const sel = drink === d.label;
              return (
                <button
                  key={d.label}
                  onClick={() => setDrink(d.label)}
                  className="flex items-center gap-2 rounded-xl p-3 text-left text-sm font-medium transition-all"
                  style={{
                    background: sel ? '#7F77DD' : '#111120',
                    color: sel ? '#fff' : '#888',
                    border: `0.5px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                  }}
                >
                  <span className="text-lg">{d.emoji}</span> {d.label}
                </button>
              );
            })}
          </div>
          {drink === 'Sonstiges' && (
            <input
              type="text"
              value={drinkOther}
              onChange={e => setDrinkOther(e.target.value)}
              placeholder="Was trinkst du so?"
              maxLength={40}
              className="mt-3 w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
              autoFocus
            />
          )}
        </div>
      )}

      {/* Step 7: Vibe-Schieberegler */}
      {step === 7 && (
        <div className="flex flex-col items-center pt-4">
          <span className="text-6xl font-bold" style={{ color: VIBE_MAP[vibeScore].color }}>{vibeScore}</span>
          <span className="mt-2 text-3xl">{VIBE_MAP[vibeScore].emoji}</span>
          <p className="mt-2 text-sm font-medium" style={{ color: VIBE_MAP[vibeScore].color }}>{VIBE_MAP[vibeScore].label}</p>
          <input
            type="range"
            min={0}
            max={10}
            value={vibeScore}
            onChange={e => setVibeScore(Number(e.target.value))}
            className="mt-8 w-full accent-[#7F77DD]"
          />
          <div className="mt-2 flex w-full justify-between text-xs" style={{ color: '#555' }}>
            <span>Homebody</span><span>Party Animal</span>
          </div>
        </div>
      )}

      {/* Step 8: Perfekter Abend */}
      {step === 8 && (
        <div className="flex flex-col gap-2">
          {EVENINGS.map(e => {
            const sel = evening === e.label;
            return (
              <button
                key={e.label}
                onClick={() => setEvening(e.label)}
                className="flex items-center gap-3 rounded-xl p-4 text-left text-sm font-medium transition-all"
                style={{
                  background: sel ? '#7F77DD' : '#111120',
                  color: sel ? '#fff' : '#888',
                  border: `0.5px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                }}
              >
                <span className="text-xl">{e.emoji}</span> {e.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 9: Persönlichkeit */}
      {step === 9 && (
        <div>
          <div className="flex flex-col gap-2">
            {PERSONAS.map(p => {
              const sel = personaColor === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => { setPersonaColor(p.key); setPersonaText(''); }}
                  className="rounded-xl p-4 text-left transition-all"
                  style={{
                    background: sel ? p.bg : '#111120',
                    border: `1px solid ${sel ? p.color : '#2a2a3a'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: '#888' }}>{p.desc}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs" style={{ color: '#555' }}>Oder schreib es selbst</p>
            <div className="relative">
              <textarea
                value={personaText}
                onChange={e => { setPersonaText(e.target.value); if (e.target.value) setPersonaColor(''); }}
                placeholder="z.B. 'Techno-Junkie, immer auf der Suche nach dem nächsten Set.'"
                maxLength={100}
                rows={2}
                className="w-full resize-none rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
              />
              <span className="absolute bottom-2 right-3 text-xs" style={{ color: '#555' }}>{personaText.length}/100</span>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
