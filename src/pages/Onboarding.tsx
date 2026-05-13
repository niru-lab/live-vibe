import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import EventerFlow from '@/components/onboarding/EventerFlow';

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<string>('user');
  const [username, setUsername] = useState('');
  const [ready, setReady] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
      return;
    }
    if (!user) return;
    (async () => {
      let { data } = await supabase
        .from('profiles')
        .select('id, username, profile_type, onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      // Create profile on the fly if missing (e.g. trigger didn't fire for OAuth)
      if (!data) {
        const fallbackName =
          (user.user_metadata as any)?.username ||
          (user.email ? user.email.split('@')[0].replace(/\./g, '_') : 'user') +
            '_' + user.id.slice(0, 4);
        const display =
          (user.user_metadata as any)?.full_name ||
          (user.user_metadata as any)?.name ||
          fallbackName;
        const { data: created } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || `u_${user.id.slice(0, 6)}`,
            display_name: display,
            onboarding_complete: false,
          } as any)
          .select('id, username, profile_type, onboarding_complete')
          .maybeSingle();
        data = created;
      }

      if (!data) {
        // Couldn't create — bounce to auth so user can try again
        navigate('/', { replace: true });
        return;
      }

      if (data.onboarding_complete) {
        navigate('/', { replace: true });
        return;
      }

      setProfileId(data.id);
      setProfileType(data.profile_type || 'user');
      if (data.username) setUsername(data.username);
      setReady(true);
    })();
  }, [user, authLoading, navigate]);

  const handleComplete = () => {
    setShowSuccess(true);
    setTimeout(() => navigate('/feed', { replace: true, state: { startAppTour: true } }), 1500);
  };

  if (authLoading || !ready) return null;

  if (showSuccess) {
    const isEventer = profileType === 'eventer' || profileType === 'club' || profileType === 'organizer';
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center" style={{ background: '#08080f' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(34, 197, 94, 0.15)' }}
        >
          <Check size={32} weight="bold" color="#22c55e" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-white"
        >
          {isEventer ? 'Dein Profil ist live! 🚀' : 'Dein Feed wartet! 🎉'}
        </motion.h1>
      </div>
    );
  }

  const isEventer = profileType === 'eventer' || profileType === 'club' || profileType === 'organizer';

  if (isEventer) {
    return <EventerFlow profileId={profileId!} onComplete={handleComplete} />;
  }

  return (
    <OnboardingFlow
      profileId={profileId!}
      userId={user!.id}
      initialUsername={username}
      onComplete={handleComplete}
    />
  );
}
