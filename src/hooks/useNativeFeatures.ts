import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

const isCancelled = (e: unknown) => {
  const msg = String((e as { message?: string })?.message ?? e ?? '').toLowerCase();
  return msg.includes('cancel') || msg.includes('abbruch') || msg.includes('no image picked');
};

const dataUrlToBlob = (dataUrl: string): Blob | null => {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, b64] = match;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const useNativeFeatures = () => {
  const isNative = Capacitor.isNativePlatform();
  const { data: profile } = useProfile();

  // Push Notifications
  const initPushNotifications = useCallback(async () => {
    if (!isNative) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration token:', token.value);
      if (!profile) return;
      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      const { error } = await supabase.from('push_tokens').upsert(
        {
          profile_id: profile.id,
          token: token.value,
          platform,
        },
        { onConflict: 'token' },
      );
      if (error) console.error('Failed to store push token:', error);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification);
    });
  }, [isNative, profile]);

  // Camera — explicit source, permission-checked, stable DataUrl result
  const takePhoto = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) throw new Error('NATIVE_MEDIA_UNAVAILABLE');

    const perms = await Camera.checkPermissions();
    if (perms.camera !== 'granted') {
      const req = await Camera.requestPermissions({ permissions: ['camera'] });
      if (req.camera !== 'granted') throw new Error('CAMERA_PERMISSION_DENIED');
    }

    try {
      return await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
    } catch (e: any) {
      throw new Error(isCancelled(e) ? 'CAMERA_CANCELLED' : 'NATIVE_MEDIA_UNAVAILABLE');
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) throw new Error('NATIVE_MEDIA_UNAVAILABLE');

    const perms = await Camera.checkPermissions();
    if (perms.photos !== 'granted' && perms.photos !== 'limited') {
      const req = await Camera.requestPermissions({ permissions: ['photos'] });
      if (req.photos !== 'granted' && req.photos !== 'limited') {
        throw new Error('PHOTO_PERMISSION_DENIED');
      }
    }

    try {
      return await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
    } catch (e: any) {
      throw new Error(isCancelled(e) ? 'PHOTO_PICKER_CANCELLED' : 'NATIVE_MEDIA_UNAVAILABLE');
    }
  }, []);

  // Avatar upload — accepts Blob/File or data URL, returns final display URL
  const uploadAvatar = useCallback(
    async (input: Blob | File | string) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('AVATAR_UPLOAD_FAILED');

      const blob = typeof input === 'string' ? dataUrlToBlob(input) : input;
      if (!blob || !ALLOWED_MIME.includes(blob.type)) throw new Error('AVATAR_INVALID_IMAGE');
      if (blob.size > MAX_AVATAR_BYTES) throw new Error('AVATAR_INVALID_IMAGE');

      const ext = MIME_EXT[blob.type] ?? 'jpg';
      const path = `avatars/${userId}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from('post-media')
        .upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: '0' });
      if (error) throw new Error('AVATAR_UPLOAD_FAILED');

      // remove stale variants with a different extension (own folder only)
      const stale = Object.values(MIME_EXT)
        .filter((e) => e !== ext)
        .map((e) => `avatars/${userId}/avatar.${e}`);
      if (stale.length) {
        try {
          await supabase.storage.from('post-media').remove(stale);
        } catch {
          /* ignore cleanup errors */
        }
      }

      const { data } = supabase.storage.from('post-media').getPublicUrl(path);
      return `${data.publicUrl}?v=${Date.now()}`;
    },
    [],
  );

  // Geolocation
  const getCurrentPosition = useCallback(async () => {
    const permResult = await Geolocation.requestPermissions();
    if (permResult.location === 'granted' || permResult.coarseLocation === 'granted') {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }
    return null;
  }, []);

  // Initialize push notifications when profile is available
  useEffect(() => {
    if (isNative && profile) {
      initPushNotifications();
    }
  }, [isNative, profile, initPushNotifications]);

  return {
    isNative,
    takePhoto,
    pickFromGallery,
    uploadAvatar,
    getCurrentPosition,
  };
};
