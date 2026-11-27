import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useProfile } from '@/hooks/useProfile';
import { pushTargetPath, registerForPush } from '@/lib/pushRegistration';

/**
 * Mounted once in App (inside the router), native only:
 * - refreshes the device token on every launch if push is already allowed (never prompts),
 *   so tokens survive reinstalls/rotation;
 * - opens the push's `url` when the user taps a notification.
 */
export const PushBridge = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const refreshedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !profile?.id || refreshedFor.current === profile.id) return;
    refreshedFor.current = profile.id;
    void registerForPush(profile.id, { prompt: false });
  }, [profile?.id]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import('@capacitor/push-notifications').then(async ({ PushNotifications }) => {
      const handle = await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        const path = pushTargetPath(notification.data);
        if (path) navigate(path);
      });
      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    });
    return () => { cancelled = true; remove?.(); };
  }, [navigate]);

  return null;
};
