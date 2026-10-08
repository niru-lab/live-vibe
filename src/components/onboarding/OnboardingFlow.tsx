import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
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
import StepCity from './steps/StepCity';
import StepInvite from './steps/StepInvite';
import StepChoice, { StepConsents } from './steps/StepChoice';

interface Props {
  profileId: string;
  userId: string;
  initialUsername: string;
  initialStep?: number;
  onComplete: () => void;
}

interface Data {
  birthdate: string;
  username: string;
  genres: string[];
  artist: string;
  weekendType: string;
  drink: string;
  cities: string[];
  frequency: string[];
  days: string[];
  budget: string[];
  venueTypes: string[];
  analytics: boolean;
  marketing: boolean;
}

const TOTAL = 13;

const FREQUENCY = ['Selten', '1–2× im Monat', 'Jedes Wochenende', 'Mehrmals pro Woche'];
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const BUDGET = ['bis 20 €', '20–50 €', '50–100 €', '100 €+'];
const VENUE_TYPES = ['Club', 'Bar', 'Café', 'Festival'];

const stepSchema: Record<number, z.ZodTypeAny> = {
  3: z.array(z.string()).min(1),
  7: z.array(z.string()).min(1),
  8: z.array(z.string()).length(1),
  9: z.array(z.string()).min(1),
  10: z.array(z.string()).length(1),
  11: z.array(z.string()).min(1),
};

const TITLES: Record<number, { title: string; sub: string }> = {
  1: { title: 'Wie alt bist du?', sub: 'Wir fragen nur einmal. Versprochen.' },
  2: { title: 'Wähl deinen Namen', sub: 'Einmal gewählt, immer gecheckt.' },
  3: { title: 'Was läuft bei dir?', sub: 'Wähl alles was passt.' },
  4: { title: 'Wer ist dein Artist?', sub: 'Dein liebster Act, egal ob Club oder Festival.' },
  5: { title: 'Wie verbringst du deinen Freitag?', sub: 'Keine falsche Antwort.' },
  6: { title: 'Was trinkst du so?', sub: "Wir versprechen, wir erzählen's niemandem. 🤫" },
  7: { title: 'Wo willst du raus?', sub: 'Wähl mindestens eine Stadt — mehrere gehen auch.' },
  8: { title: 'Wie oft gehst du raus?', sub: 'Ehrlich ist am besten.' },
  9: { title: 'Deine Lieblingstage?', sub: 'Wähl alle, die passen.' },
  10: { title: 'Wie viel gibst du pro Abend aus?', sub: 'Nur damit wir passende Spots zeigen.' },
  11: { title: 'Wo fühlst du dich wohl?', sub: 'Mehrfachauswahl möglich.' },
  12: { title: 'Deine Einwilligungen', sub: 'Du kannst das jederzeit in den Einstellungen ändern.' },
  13: { title: 'Wen nimmst du mit?', sub: 'Optional — du kannst das auch überspringen.' },
};

export default function OnboardingFlow({ profileId, userId, initialUsername, initialStep = 1, onComplete }: Props) {
  const [step, setStep] = useState(Math.min(initialStep, TOTAL));
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
    cities: [],
    frequency: [],
    days: [],
    budget: [],
    venueTypes: [],
    analytics: false,
    marketing: false,
  });

  // Resume: load previously saved answers so nothing is overwritten with blanks.
  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from('profiles').select('age, username, music_genres, favorite_artist, perfect_evening, favorite_drink, cities').eq('id', profileId).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      setData((d) => ({
        ...d,
        birthdate: p?.age ? String(p.age) : d.birthdate,
        username: p?.username || d.username,
        genres: p?.music_genres?.length ? p.music_genres : d.genres,
        artist: p?.favorite_artist || d.artist,
        weekendType: p?.perfect_evening || d.weekendType,
        drink: p?.favorite_drink || d.drink,
        cities: p?.cities?.length ? p.cities : d.cities,
        frequency: pr?.frequency ? [pr.frequency] : d.frequency,
        days: pr?.preferred_days?.length ? pr.preferred_days : d.days,
        budget: pr?.budget_range ? [pr.budget_range] : d.budget,
        venueTypes: pr?.venue_types?.length ? pr.venue_types : d.venueTypes,
      }));
    })();
  }, [profileId, userId]);

  const update = <K extends keyof Data>(k: K, v: Data[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const handleUsernameValidity = useCallback((v: boolean) => setUsernameValid(v), []);

  const canProceed = (() => {
    switch (step) {
      case 1: return isAgeValid(data.birthdate);
      case 2: return usernameValid;
      case 3: return stepSchema[3].safeParse(data.genres).success;
      case 4: return true; // optional
      case 5: return data.weekendType.length > 0;
      case 6: return data.drink.length > 0;
      case 7: return stepSchema[7].safeParse(data.cities).success;
      case 8: return stepSchema[8].safeParse(data.frequency).success;
      case 9: return stepSchema[9].safeParse(data.days).success;
      case 10: return stepSchema[10].safeParse(data.budget).success;
      case 11: return stepSchema[11].safeParse(data.venueTypes).success;
      case 12: return true;
      case 13: return true; // optional nudge
      default: return false;
    }
  })();

  const ageNum = parseInt(data.birthdate, 10);
  const age = isNaN(ageNum) ? null : ageNum;

  const profilePatch = () => ({
    ...(usernameValid || step > 2 ? { username: data.username } : {}),
    age,
    music_genres: data.genres,
    vibes: data.genres.slice(0, 3),
    favorite_artist: data.artist || null,
    perfect_evening: data.weekendType || null,
    favorite_drink: data.drink || null,
    city: data.cities[0] || null,
    cities: data.cities,
  });

  /** Save after every step so an interrupted onboarding resumes where it stopped. */
  const persist = async (completedStep: number) => {
    await supabase.from('profiles').update({ ...profilePatch(), onboarding_step: completedStep } as any).eq('id', profileId);
    if (completedStep >= 8) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        genres: data.genres,
        frequency: data.frequency[0] ?? null,
        preferred_days: data.days,
        budget_range: data.budget[0] ?? null,
        venue_types: data.venueTypes,
        updated_at: new Date().toISOString(),
      });
    }
    if (completedStep === 12) {
      const locked = age !== null && age < 16;
      await supabase.from('user_consents').insert([
        { user_id: userId, consent_type: 'analytics', granted: !locked && data.analytics, version: 'v1' },
        { user_id: userId, consent_type: 'marketing', granted: !locked && data.marketing, version: 'v1' },
      ]);
    }
  };

  const goNext = async () => {
    if (step === TOTAL) { handleFinish(); return; }
    setSaving(true);
    await persist(step);
    setSaving(false);
    setDirection(1);
    setStep(s => s + 1);
  };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(1, s - 1)); };
  const skip = async () => {
    if (step === TOTAL) { handleFinish(); return; }
    await persist(step);
    setDirection(1);
    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    await supabase.from('profiles').update({
      ...profilePatch(),
      city: data.cities[0] || 'Stuttgart',
      onboarding_step: TOTAL,
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
              {step === 7 && <StepCity selected={data.cities} onChange={v => update('cities', v)} />}
              {step === 8 && <StepChoice options={FREQUENCY} selected={data.frequency} onChange={v => update('frequency', v)} />}
              {step === 9 && <StepChoice multi options={DAYS} selected={data.days} onChange={v => update('days', v)} />}
              {step === 10 && <StepChoice options={BUDGET} selected={data.budget} onChange={v => update('budget', v)} />}
              {step === 11 && <StepChoice multi options={VENUE_TYPES} selected={data.venueTypes} onChange={v => update('venueTypes', v)} />}
              {step === 12 && (
                <StepConsents
                  age={age}
                  analytics={data.analytics}
                  marketing={data.marketing}
                  onChange={v => setData(d => ({ ...d, ...v }))}
                />
              )}
              {step === 13 && <StepInvite />}
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
        {(step === 4 || step === TOTAL) && (
          <button
            onClick={skip}
            disabled={saving}
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
