import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

let listenerProfileId: string | null = null;

/**
 * Asks for push permission (native only) and stores the device token.
 * Only call right after the user explicitly asked for notifications (PushPrimer "Ja", or ringing a bell).
 * Returns true when the device can receive pushes.
 */
export async function registerForPush(profileId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const current = await PushNotifications.checkPermissions();
    const perm = current.receive === 'granted' ? current : await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return false;
    // One token listener per app session; it always stores for the latest profile.
    const firstListener = listenerProfileId === null;
    listenerProfileId = profileId;
    if (firstListener) {
      await PushNotifications.addListener('registration', async ({ value }) => {
        if (!listenerProfileId) return;
        const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        await supabase.from('push_tokens').upsert(
          { profile_id: listenerProfileId, token: value, platform, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'token' },
        );
      });
    }
    await PushNotifications.register();
    return true;
  } catch (e) {
    console.warn('Push registration failed', e);
    return false;
  }
}
