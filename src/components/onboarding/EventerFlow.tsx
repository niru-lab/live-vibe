import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from './OnboardingLayout';

const SERVICE_TYPES = [
  { emoji: '🎧', label: 'Club' },
  { emoji: '🍸', label: 'Bar' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🌆', label: 'Rooftop / Lounge' },
  { emoji: '🎪', label: 'Veranstalter / Promoter' },
  { emoji: '🍽️', label: 'Restaurant' },
  { emoji: '✏️', label: 'Sonstiges' },
];

const PRICE_SEGMENTS = [
  { symbol: '€', desc: 'Günstig / Kein Eintritt' },
  { symbol: '€€', desc: 'Mittelklasse / Normaler Eintritt' },
  { symbol: '€€€', desc: 'Premium / Exklusiv' },
];

interface EventerFlowProps {
  profileId: string;
  onComplete: () => void;
}

export default function EventerFlow({ profileId, onComplete }: EventerFlowProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  const [venueName, setVenueName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceOther, setServiceOther] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [priceSegment, setPriceSegment] = useState('');
  const [description, setDescription] = useState('');

  const TOTAL = 6;

  const canProceed = (() => {
    switch (step) {
      case 1: return venueName.length >= 2;
      case 2: return !!serviceType && (serviceType !== 'Sonstiges' || serviceOther.length >= 2);
      case 3: return city.length >= 2 && address.length >= 3;
      case 5: return !!priceSegment;
      default: return true;
    }
  })();

  const isOptional = step === 4 || step === 6;

  const goNext = () => {
    if (step === TOTAL) { handleComplete(); return; }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const handleComplete = async () => {
    setSaving(true);
    const venueType = serviceType === 'Sonstiges' ? serviceOther : serviceType;
    await supabase.from('profiles').update({
      venue_name: venueName,
      venue_type: venueType,
      city,
      address,
      opens_at: opensAt || null,
      closes_at: closesAt || null,
      price_segment: priceSegment,
      venue_description: description || null,
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

  const labeledInputStyle: React.CSSProperties = {
    background: '#111120',
    border: '0.5px solid #2a2a3a',
    borderRadius: 8,
    color: '#fff',
    padding: '12px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  const titles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Wie heißt dein Laden?', sub: 'Am besten genau der Name eures Clubs, Bar oder Cafés.' },
    2: { title: 'Was bietest du an?', sub: 'Wähle deinen Typ.' },
    3: { title: 'Wo seid ihr?', sub: 'Stadt und Adresse für die Karte.' },
    4: { title: 'Eure Öffnungszeiten?', sub: 'Typische Abend- und Nachtzeiten.' },
    5: { title: 'Euer Preissegment?', sub: 'Hilft Usern die richtige Erwartung zu setzen.' },
    6: { title: 'Beschreibt euch in einem Satz.', sub: 'Was macht euren Laden besonders?' },
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
      {/* Step 1: Venue Name */}
      {step === 1 && (
        <input
          type="text"
          value={venueName}
          onChange={e => setVenueName(e.target.value)}
          placeholder="z.B. Club Lehmann"
          style={inputStyle}
          maxLength={40}
          autoFocus
        />
      )}

      {/* Step 2: Service-Typ */}
      {step === 2 && (
        <div>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_TYPES.map(s => {
              const sel = serviceType === s.label;
              return (
                <button
                  key={s.label}
                  onClick={() => setServiceType(s.label)}
                  className="flex items-center gap-2 rounded-xl p-3 text-left text-sm font-medium transition-all"
                  style={{
                    background: sel ? '#7F77DD' : '#111120',
                    color: sel ? '#fff' : '#888',
                    border: `0.5px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                  }}
                >
                  <span className="text-lg">{s.emoji}</span> {s.label}
                </button>
              );
            })}
          </div>
          {serviceType === 'Sonstiges' && (
            <input
              type="text"
              value={serviceOther}
              onChange={e => setServiceOther(e.target.value)}
              placeholder="Was ist euer Konzept?"
              maxLength={40}
              className="mt-3 w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
              autoFocus
            />
          )}
        </div>
      )}

      {/* Step 3: Standort */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wider" style={{ color: '#888' }}>STADT</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Stuttgart" style={labeledInputStyle} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wider" style={{ color: '#888' }}>ADRESSE</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Theodor-Heuss-Str. 15" style={labeledInputStyle} />
          </div>
        </div>
      )}

      {/* Step 4: Öffnungszeiten */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wider" style={{ color: '#888' }}>ÖFFNET UM</label>
            <input type="text" value={opensAt} onChange={e => setOpensAt(e.target.value)} placeholder="22:00" style={labeledInputStyle} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-wider" style={{ color: '#888' }}>SCHLIESST UM</label>
            <input type="text" value={closesAt} onChange={e => setClosesAt(e.target.value)} placeholder="06:00" style={labeledInputStyle} />
          </div>
        </div>
      )}

      {/* Step 5: Preissegment */}
      {step === 5 && (
        <div className="grid grid-cols-3 gap-2">
          {PRICE_SEGMENTS.map(p => {
            const sel = priceSegment === p.symbol;
            return (
              <button
                key={p.symbol}
                onClick={() => setPriceSegment(p.symbol)}
                className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all"
                style={{
                  background: sel ? '#111120' : '#111120',
                  border: `1px solid ${sel ? '#7F77DD' : '#2a2a3a'}`,
                }}
              >
                <span className="text-2xl font-bold" style={{ color: sel ? '#7F77DD' : '#555' }}>{p.symbol}</span>
                <span className="text-center text-xs" style={{ color: '#888' }}>{p.desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 6: Beschreibung */}
      {step === 6 && (
        <div className="relative">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='z.B. "Stuttgarts ältester Techno-Club — rauer Sound, echte Community."'
            maxLength={120}
            rows={4}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: '#111120', border: '0.5px solid #2a2a3a' }}
            autoFocus
          />
          <span className="absolute bottom-2 right-3 text-xs" style={{ color: '#555' }}>{description.length}/120</span>
        </div>
      )}
    </OnboardingLayout>
  );
}
