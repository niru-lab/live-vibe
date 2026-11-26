import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useLocationConsent } from '@/hooks/useLocationConsent';
import { useAppOpenTracker } from '@/hooks/useAppOpenTracker';
import { useEventPresence } from '@/hooks/useEventPresence';
import {
  loadReminderState, markReminderDismissed, markReminderShown, reminderAllowed, saveReminderState,
} from '@/lib/locationReminder';
import { LocationPromptSheet } from './LocationPromptSheet';
import { useTourActive } from '@/lib/tourState';

// No location questions during sign-up, onboarding or on public/legal pages.
const QUIET_PREFIXES = [
  '/welcome', '/auth', '/register', '/verify', '/reset-password', '/role', '/onboarding',
  '/impressum', '/datenschutz', '/agb', '/community', '/konto-loeschen',
];

/**
 * App-wide location handling (mounted once in App).
 * 1) First app start after onboarding: explain, then ask for location.
 * 2) Declined: in-app reminder on the 2nd app open within an hour (max 1× / 7 days, stops after 3× "Nicht jetzt").
 */
export const LocationGate = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { pathname } = useLocation();
  const consent = useLocationConsent();
  const [reminderOpen, setReminderOpen] = useState(false);

  // The old Discover opt-in lived only in localStorage and is replaced by the server-side setting.
  useEffect(() => { try { localStorage.removeItem('feyrn.presence.consent'); } catch { /* ignore */ } }, []);

  const ready = !!user && !!profile?.onboarding_complete && !consent.isLoading && !!consent.status;
  const tourActive = useTourActive();
  // Never on top of the app tour — the location question comes right after it.
  const quiet = tourActive || pathname === '/' || QUIET_PREFIXES.some((p) => pathname.startsWith(p));
  const startOpen = ready && !quiet && !consent.decided;

  // An open can be registered before the consent status has loaded (cold start) — keep it until it has.
  const [pendingReminder, setPendingReminder] = useState(false);
  const onSecondOpen = useCallback(() => setPendingReminder(true), []);

  useEffect(() => {
    if (!pendingReminder || !ready || !user) return;
    setPendingReminder(false);
    if (consent.enabled || !consent.decided) return;
    const now = Date.now();
    const state = loadReminderState(user.id);
    if (!reminderAllowed(state, now)) return;
    saveReminderState(user.id, markReminderShown(state, now));
    setReminderOpen(true);
  }, [pendingReminder, ready, user, consent.enabled, consent.decided]);

  useAppOpenTracker(user?.id, onSecondOpen);
  // Presence pings run app-wide (foreground only) as soon as the user opted in.
  useEventPresence(ready && consent.enabled);

  const acceptStart = async () => { await consent.enable('start_sheet'); };
  const declineStart = async () => { await consent.disable('start_sheet'); };

  const acceptReminder = async () => {
    setReminderOpen(false);
    await consent.enable('reminder');
  };
  const declineReminder = () => {
    setReminderOpen(false);
    if (user) saveReminderState(user.id, markReminderDismissed(loadReminderState(user.id)));
  };

  if (startOpen) {
    return <LocationPromptSheet open variant="start" busy={consent.saving} onAccept={acceptStart} onDecline={declineStart} />;
  }
  return (
    <LocationPromptSheet
      open={reminderOpen && !quiet && !consent.enabled}
      variant="reminder"
      busy={consent.saving}
      onAccept={acceptReminder}
      onDecline={declineReminder}
    />
  );
};
