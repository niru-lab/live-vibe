import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import VenueOnboardingLayout from '@/components/venue-onboarding/VenueOnboardingLayout';
import VenueStepTransition from '@/components/venue-onboarding/VenueStepTransition';
import StepVenueType from '@/components/venue-onboarding/steps/StepVenueType';
import StepVenueName from '@/components/venue-onboarding/steps/StepVenueName';
import StepVenueAddress, { AddressData } from '@/components/venue-onboarding/steps/StepVenueAddress';
import StepVenueTimeSlots from '@/components/venue-onboarding/steps/StepVenueTimeSlots';
import StepVenueDayPattern from '@/components/venue-onboarding/steps/StepVenueDayPattern';
import StepVenueOfferings from '@/components/venue-onboarding/steps/StepVenueOfferings';
import StepVenuePriceTier from '@/components/venue-onboarding/steps/StepVenuePriceTier';
import StepVenueContact, { ContactData } from '@/components/venue-onboarding/steps/StepVenueContact';

const TOTAL_STEPS = 8;
const PHONE_RE = /^(\+49|0)[1-9][0-9]{8,11}$/;

const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Was für ein Spot bist du? 💫',  subtitle: 'Wähl eine — wir filtern den Rest für dich' },
  2: { title: 'Wie heißt der Laden? 🎤',       subtitle: 'Damit Leute dich finden' },
  3: { title: 'Wo finden wir dich? 📍',        subtitle: 'Ohne Pin keine Gäste' },
  4: { title: 'Wann gehts bei dir ab? ⏰',     subtitle: 'Mehrfachauswahl — passt zu deinem Vibe?' },
  5: { title: 'An welchen Tagen? 📅',          subtitle: 'Wann läuft bei dir was?' },
  6: { title: 'Was läuft bei dir? 🎁',         subtitle: 'Such alles aus was passt — min 1, max 8' },
  7: { title: 'Wie teuer ist Spaß bei dir? 💸', subtitle: 'Damit Gäste wissen worauf sie sich einlassen' },
  8: { title: 'Wie erreichen wir dich? 📱',     subtitle: 'Nur für uns — Gäste sehen das nicht' },
};

export default function OnboardingVenue() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const venueHome = '/events';

  const [profileId, setProfileId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [venueType, setVenueType] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState<AddressData>({
    street: '', zip: '', city: 'Aalen', lat: null, lng: null, skipped: false,
  });
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [dayPattern, setDayPattern] = useState('');
  const [offerings, setOfferings] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState('');
  const [contact, setContact] = useState<ContactData>({ phone: '', whatsapp_ok: false });

  // Boot
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
      return;
    }
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) {
        navigate('/', { replace: true });
        return;
      }
      if (data.onboarding_complete) {
        navigate(venueHome, { replace: true });
        return;
      }
      setProfileId(data.id);
      setReady(true);
    })();
  }, [user, authLoading, navigate]);

  const canProceed = (() => {
    switch (step) {
      case 1: return venueType.length > 0;
      case 2: return name.trim().length >= 2 && name.length <= 60;
      case 3: return address.skipped || (address.street.trim().length > 2 && /^\d{5}$/.test(address.zip) && address.city.trim().length > 1);
      case 4: return timeSlots.length >= 1;
      case 5: return dayPattern.length > 0;
      case 6: return offerings.length >= 1 && offerings.length <= 8;
      case 7: return priceTier.length > 0;
      case 8: return PHONE_RE.test(contact.phone.replace(/\s/g, ''));
      default: return false;
    }
  })();

  const next = async () => {
    if (!canProceed) return;
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
      return;
    }
    // Finish
    if (!profileId || !user) return;
    setSaving(true);
    try {
      const fullAddress = address.skipped ? null : `${address.street}, ${address.zip} ${address.city}`;
      const insertPayload = {
        owner_profile_id: profileId,
        name: name.trim(),
        category: venueType,
        venue_type: venueType,
        address_street: address.skipped ? null : address.street.trim(),
        address_zip: address.skipped ? null : address.zip,
        address_city: address.skipped ? null : address.city.trim(),
        address_skipped: address.skipped,
        address: fullAddress,
        city: address.skipped ? null : address.city.trim(),
        latitude: address.skipped ? null : address.lat,
        longitude: address.skipped ? null : address.lng,
        time_slots: timeSlots,
        day_pattern: dayPattern,
        offerings,
        price_tier: priceTier,
        phone: contact.phone.replace(/\s/g, ''),
        whatsapp_ok: contact.whatsapp_ok,
        verification_tier: 1,
      } as any;

      const { error: venueErr } = await supabase.from('venues').insert(insertPayload);
      if (venueErr) throw venueErr;

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', profileId);
      if (profErr) throw profErr;

      toast.success('Willkommen bei Feyrn! Dein Spot ist drin 🔥');
      setSuccess(true);
      setTimeout(() => navigate(venueHome, { replace: true }), 1600);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Konnte Spot nicht speichern');
      setSaving(false);
    }
  };

  const back = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  if (authLoading || !ready) {
    return <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#0A0A0F' }} />;
  }

  if (success) {
    return (
      <div
        className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden"
        style={{ background: '#0A0A0F' }}
      >
        {/* Confetti pulse */}
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 1, scale: 0 }}
            animate={{ y: 400, opacity: 0, scale: 1, rotate: 360 }}
            transition={{ duration: 1.8, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '40%',
              left: `${10 + (i * 3.5) % 80}%`,
              width: 10, height: 10,
              borderRadius: 2,
              background: i % 2 === 0 ? '#7C3AED' : '#EC4899',
            }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          style={{ fontSize: 64, marginBottom: 16 }}
        >
          🚀
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white text-center px-6"
        >
          Dein Spot ist live!
        </motion.h1>
      </div>
    );
  }

  const meta = STEP_TITLES[step];

  return (
    <VenueOnboardingLayout
      step={step}
      totalSteps={TOTAL_STEPS}
      title={meta.title}
      subtitle={meta.subtitle}
      canProceed={canProceed}
      saving={saving}
      isFinal={step === TOTAL_STEPS}
      ctaLabel={step === TOTAL_STEPS ? 'Spot aktivieren 🚀' : 'Weiter'}
      onNext={next}
      onBack={step > 1 ? back : undefined}
    >
      <VenueStepTransition stepKey={step} direction={direction}>
        {step === 1 && <StepVenueType value={venueType} onChange={setVenueType} />}
        {step === 2 && <StepVenueName value={name} onChange={setName} />}
        {step === 3 && (
          <StepVenueAddress
            value={address}
            onChange={setAddress}
            allowSkip={venueType === 'event_crew'}
          />
        )}
        {step === 4 && <StepVenueTimeSlots value={timeSlots} onChange={setTimeSlots} />}
        {step === 5 && <StepVenueDayPattern value={dayPattern} onChange={setDayPattern} />}
        {step === 6 && <StepVenueOfferings value={offerings} onChange={setOfferings} />}
        {step === 7 && <StepVenuePriceTier value={priceTier} onChange={setPriceTier} />}
        {step === 8 && <StepVenueContact value={contact} onChange={setContact} />}
      </VenueStepTransition>
    </VenueOnboardingLayout>
  );
}
