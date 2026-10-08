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
import { StepVenueProof, StepVenueLogo, StepVenueAgreement, isProofValid, ProofData } from '@/components/venue-onboarding/steps/StepVenueVerification';

const TOTAL_STEPS = 11;
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
  9: { title: 'Kurzer Echtheits-Check ✅',      subtitle: 'Impressum-Link oder Handelsregisternummer reicht' },
  10: { title: 'Zeig dein Logo 🎨',             subtitle: 'Damit Gäste dich sofort erkennen' },
  11: { title: 'Letzter Schritt 🤝',            subtitle: 'Danach kannst du direkt loslegen' },
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
  const [venueId, setVenueId] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofData>({ contactName: '', imprintUrl: '', registerNumber: '', capacity: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

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
      // Resume: venue already created → continue with verification steps.
      const { data: member } = await supabase
        .from('venue_members')
        .select('venue_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (member?.venue_id) {
        setVenueId(member.venue_id);
        setStep(9);
      }
      setReady(true);
    })();
  }, [user, authLoading, navigate]);

  // If the type is switched away from event_crew, a previously skipped address
  // must be re-required (only event_crew may skip).
  useEffect(() => {
    if (venueType !== 'event_crew' && address.skipped) {
      setAddress((a) => ({ ...a, skipped: false }));
    }
  }, [venueType, address.skipped]);

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
      case 9: return isProofValid(proof);
      case 10: return true;
      case 11: return agreed;
      default: return false;
    }
  })();

  const next = async () => {
    if (!canProceed) return;
    if (step < 8) {
      setDirection(1);
      setStep((s) => s + 1);
      return;
    }
    if (!profileId || !user) return;
    if (step > 8) {
      setSaving(true);
      try {
        if (step === 9) {
          const { error } = await supabase.from('venues').update({
            contact_name: proof.contactName.trim(),
            imprint_url: proof.imprintUrl.trim() || null,
            register_number: proof.registerNumber.trim() || null,
            capacity: proof.capacity ? Number(proof.capacity) : null,
          }).eq('id', venueId!);
          if (error) throw error;
        }
        if (step === 10 && logoFile) {
          const ext = logoFile.name.split('.').pop() || 'png';
          const path = `${user.id}/venue-logos/${venueId}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('post-media').upload(path, logoFile);
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
          const { error } = await supabase.from('venues').update({ logo_url: publicUrl, image_url: publicUrl }).eq('id', venueId!);
          if (error) throw error;
        }
        if (step === 11) {
          const { error } = await supabase.from('venue_agreements').insert({ venue_id: venueId!, user_id: user.id, agreement_version: 'v1' });
          if (error) throw error;
          const { error: profErr } = await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', profileId);
          if (profErr) throw profErr;
          setSuccess(true);
          return;
        }
        setDirection(1);
        setStep((s) => s + 1);
      } catch (e: any) {
        toast.error(e?.message || 'Konnte nicht speichern');
      } finally {
        setSaving(false);
      }
      return;
    }
    // Step 8: create the venue, then continue with verification steps
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

      const { data: created, error: venueErr } = await supabase.from('venues').insert(insertPayload).select('id').single();
      if (venueErr) throw venueErr;
      setVenueId(created.id);

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ display_name: name.trim() })
        .eq('id', profileId);
      if (profErr) throw profErr;

      setSaving(false);
      setDirection(1);
      setStep(9);
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
          Danke! Wir prüfen deine Venue.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 max-w-sm px-6 text-center"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Du kannst schon jetzt Events anlegen und posten.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(venueHome, { replace: true, state: { startAppTour: true } })}
          className="mt-8 rounded-full px-8 py-4 font-semibold transition-shadow hover:shadow-[0_0_40px_rgba(236,72,153,0.55)]"
          style={{ color: '#fff', background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }}
        >
          Los geht's
        </motion.button>
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
      onBack={step > 1 && step !== 9 ? back : undefined}
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
        {step === 9 && <StepVenueProof value={proof} onChange={setProof} />}
        {step === 10 && <StepVenueLogo preview={logoPreview} onFile={(f) => { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }} />}
        {step === 11 && <StepVenueAgreement value={agreed} onChange={setAgreed} />}
      </VenueStepTransition>
    </VenueOnboardingLayout>
  );
}
