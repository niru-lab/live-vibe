import { useState, useCallback } from 'react';
import { CaretLeft } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import ProgressBar from './ProgressBar';
import StepTransition from './StepTransition';
import StepAge, { isAgeValid } from './steps/StepAge';
import StepUsername from './steps/StepUsername';
import StepGenres from './steps/StepGenres';
import StepArtist from './steps/StepArtist';
import StepWeekend from './steps/StepWeekend';
import StepDrink from './steps/StepDrink';

interface Props {
  profileId: string;
  userId: string;
  initialUsername: string;
  onComplete: () => void;
}

interface Data {
  birthdate: string;
  username: string;
  genres: string[];
  artist: string;
  weekendType: string;
  drink: string;
}

const TOTAL = 6;

const TITLES: Record<number, { title: string; sub: string }> = {
  1: { title: 'Wie alt bist du?', sub: 'Wir fragen nur einmal. Versprochen.' },
  2: { title: 'Wähl deinen Namen', sub: 'Einmal gewählt, immer gecheckt.' },
  3: { title: 'Was läuft bei dir?', sub: 'Wähl alles was passt.' },
  4: { title: 'Wer ist dein Artist?', sub: 'Dein liebster Act, egal ob Club oder Festival.' },
  5: { title: 'Wie verbringst du deinen Freitag?', sub: 'Keine falsche Antwort.' },
  6: { title: 'Was trinkst du so?', sub: "Wir versprechen, wir erzählen's niemandem. 🤫" },
};

export default function OnboardingFlow({ profileId, userId, initialUsername, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  const [data, setData] = useState<Data>({
    birthdate: '',
    username: initialUsername || '',
    genres: [],
    artist: '',
    weekendType: '',
    drink: '',
  });

  const update = <K extends keyof Data>(k: K, v: Data[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const handleUsernameValidity = useCallback((v: boolean) => setUsernameValid(v), []);

  const canProceed = (() => {
    switch (step) {
      case 1: return isAgeValid(data.birthdate);
      case 2: return usernameValid;
      case 3: return data.genres.length >= 1;
      case 4: return true; // optional
      case 5: return data.weekendType.length > 0;
      case 6: return data.drink.length > 0;
      default: return false;
    }
  })();

  const goNext = () => {
    if (step === TOTAL) { handleFinish(); return; }
    setDirection(1);
    setStep(s => s + 1);
  };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(1, s - 1)); };
  const skip = () => { setDirection(1); setStep(s => s + 1); };

  const handleFinish = async () => {
    setSaving(true);
    console.log('Onboarding complete:', data);
    const ageNum = parseInt(data.birthdate, 10);
    await supabase.from('profiles').update({
      username: data.username,
      age: isNaN(ageNum) ? null : ageNum,
      music_genres: data.genres,
      vibes: data.genres.slice(0, 3),
      favorite_artist: data.artist || null,
      perfect_evening: data.weekendType || null,
      favorite_drink: data.drink || null,
      city: 'Stuttgart',
      onboarding_complete: true,
    } as any).eq('id', profileId);
    setSaving(false);
    onComplete();
  };

  const isFinal = step === TOTAL;
  const ctaLabel = isFinal ? 'Feyrn starten 🔥' : 'Weiter';

  return (
    <div
      className="flex min-h-[100dvh] flex-col"
      style={{ background: '#0A0A0F', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top bar: back + progress */}
      <div className="sticky top-0 z-10" style={{ background: '#0A0A0F' }}>
        <div className="flex items-center justify-between px-2 pt-3">
          <button
            onClick={goBack}
            disabled={step === 1}
            aria-label="Zurück"
            style={{
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: step === 1 ? 'default' : 'pointer',
              opacity: step === 1 ? 0 : 1, transition: 'opacity 200ms',
            }}
          >
            <CaretLeft size={24} weight="thin" color="rgba(255,255,255,0.6)" />
          </button>
          <div style={{ width: 40 }} />
        </div>
        <ProgressBar step={step} total={TOTAL} />
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 pt-8 pb-32">
        <StepTransition stepKey={step} direction={direction}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {TITLES[step].title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 8, marginBottom: 28 }}>
              {TITLES[step].sub}
            </p>

            <div
              style={{
                background: '#12121A',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 18,
                backdropFilter: 'blur(12px)',
              }}
            >
              {step === 1 && <StepAge birthdate={data.birthdate} onChange={v => update('birthdate', v)} />}
              {step === 2 && (
                <StepUsername
                  username={data.username}
                  userId={userId}
                  onChange={v => update('username', v)}
                  onValidityChange={handleUsernameValidity}
                />
              )}
              {step === 3 && <StepGenres selected={data.genres} onChange={v => update('genres', v)} />}
              {step === 4 && <StepArtist artist={data.artist} onChange={v => update('artist', v)} />}
              {step === 5 && <StepWeekend value={data.weekendType} onChange={v => update('weekendType', v)} />}
              {step === 6 && <StepDrink value={data.drink} onChange={v => update('drink', v)} />}
            </div>
          </div>
        </StepTransition>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-4"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0) 0%, rgba(10,10,15,0.95) 30%, #0A0A0F 100%)',
        }}
      >
        <button
          onClick={goNext}
          disabled={!canProceed || saving}
          style={{
            width: '100%',
            padding: isFinal ? '18px 24px' : '16px 24px',
            borderRadius: 9999,
            background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
            color: '#fff',
            fontSize: isFinal ? 17 : 16,
            fontWeight: 600,
            border: 'none',
            cursor: !canProceed || saving ? 'not-allowed' : 'pointer',
            opacity: !canProceed || saving ? 0.4 : 1,
            transition: 'opacity 200ms, transform 100ms',
            boxShadow: isFinal ? '0 8px 32px rgba(236, 72, 153, 0.35)' : '0 4px 16px rgba(124, 58, 237, 0.25)',
            animation: isFinal && canProceed ? 'feyrnPulse 2.2s ease-in-out infinite' : undefined,
          }}
          onMouseDown={e => { if (canProceed && !saving) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {saving ? '...' : ctaLabel}
        </button>
        {step === 4 && (
          <button
            onClick={skip}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '10px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Überspringen
          </button>
        )}
      </div>

      <style>{`
        @keyframes feyrnPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(236, 72, 153, 0.35); }
          50% { box-shadow: 0 8px 40px rgba(236, 72, 153, 0.6), 0 0 0 4px rgba(236, 72, 153, 0.08); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
