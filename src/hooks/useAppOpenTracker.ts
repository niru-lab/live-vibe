import { useEffect, useRef } from 'react';
import { loadReminderState, registerOpen, saveReminderState } from '@/lib/locationReminder';

/**
 * Counts app opens on this device (cold start + every return to the foreground) and calls
 * `onSecondOpenWithinWindow` when the app is opened again within the active window.
 * Capacitor's WebView fires `visibilitychange` on resume, so no extra native plugin is needed.
 */
export function useAppOpenTracker(userId: string | undefined, onSecondOpenWithinWindow: () => void) {
  const callback = useRef(onSecondOpenWithinWindow);
  callback.current = onSecondOpenWithinWindow;

  useEffect(() => {
    if (!userId) return;
    const handleOpen = () => {
      const { state, secondOpenWithinWindow } = registerOpen(loadReminderState(userId), Date.now());
      saveReminderState(userId, state);
      if (secondOpenWithinWindow) callback.current();
    };
    if (document.visibilityState === 'visible') handleOpen();
    const onVisibility = () => { if (document.visibilityState === 'visible') handleOpen(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [userId]);
}
